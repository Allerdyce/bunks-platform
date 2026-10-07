import { NextRequest, NextResponse } from "next/server";
import type { Booking, Prisma, Property } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/adminAuth";
import { pendingHoldCutoff } from "@/lib/bookingAvailability";
import { notAClaim } from "@/lib/email/claims";
import { holdUntilLabel, paymentLinkState, paymentLinkUrl } from "@/lib/paymentLinks";
import { propertyToday, resolvePropertyTimeZone } from "@/lib/stayRules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin → Bookings. Tabs split the bookings the way they're worked with: upcoming stays, the
// private payment links sent, past stays, cancellations, and checkouts that were never paid.
const VIEWS = ["upcoming", "links", "past", "cancelled", "unpaid"] as const;
type View = (typeof VIEWS)[number];

const DAY_MS = 86_400_000;
const LIMIT = 150;

// Paid at some point: confirmation (or the older separate receipt) went out.
const wasPaidFilter: Prisma.BookingWhereInput = {
  emailLogs: { some: { type: { in: ["BOOKING_CONFIRMATION", "RECEIPT"] }, status: "SENT", ...notAClaim } },
};

function viewWhere(view: View, todayUtc: Date): Prisma.BookingWhereInput {
  switch (view) {
    case "upcoming":
      return { status: "PAID", checkOutDate: { gt: todayUtc } };
    case "links":
      return { paymentLinkToken: { not: null } };
    case "past":
      return { status: "PAID", checkOutDate: { lte: todayUtc } };
    case "cancelled":
      // Bookings that were real (paid, or a link sent), not restarted or abandoned checkouts.
      return { status: "CANCELLED", OR: [{ paymentLinkToken: { not: null } }, wasPaidFilter] };
    case "unpaid":
      return { status: "PENDING", paymentLinkToken: null };
  }
}

const viewOrder: Record<View, Prisma.BookingOrderByWithRelationInput[]> = {
  upcoming: [{ checkInDate: "asc" }],
  links: [{ createdAt: "desc" }],
  past: [{ checkInDate: "desc" }],
  cancelled: [{ checkInDate: "desc" }],
  unpaid: [{ createdAt: "desc" }],
};

export type BookingDisplayStatus =
  | "upcoming"
  | "staying"
  | "completed"
  | "link-waiting"
  | "link-expired"
  | "checkout-hold"
  | "abandoned"
  | "cancelled";

function displayStatus(booking: Booking & { property: Property }): BookingDisplayStatus {
  if (booking.status === "CANCELLED") return "cancelled";
  if (booking.status === "PAID") {
    const today = propertyToday(resolvePropertyTimeZone(booking.property)).getTime();
    if (booking.checkOutDate.getTime() <= today) return "completed";
    return booking.checkInDate.getTime() <= today ? "staying" : "upcoming";
  }
  if (booking.paymentLinkToken) return paymentLinkState(booking) === "awaiting-payment" ? "link-waiting" : "link-expired";
  return booking.createdAt >= pendingHoldCutoff() ? "checkout-hold" : "abandoned";
}

export async function GET(request: NextRequest) {
  const session = withAdminAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const search = params.get("search")?.trim() ?? "";
  const view: View = VIEWS.includes(params.get("view") as View) ? (params.get("view") as View) : "upcoming";
  const home = params.get("home")?.trim() || null;
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const homeWhere: Prisma.BookingWhereInput = home ? { property: { slug: home } } : {};

  // A search looks through every booking, whatever tab is open.
  const reference = search.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const where: Prisma.BookingWhereInput = search
    ? {
      ...homeWhere,
      OR: [
        { guestEmail: { contains: search, mode: "insensitive" } },
        { guestName: { contains: search, mode: "insensitive" } },
        ...(reference && reference.length <= 12 ? [{ publicReference: reference }] : []),
      ],
    }
    : { ...homeWhere, ...viewWhere(view, todayUtc) };

  const [bookings, counts] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: search ? [{ checkInDate: "desc" }] : viewOrder[view],
      take: LIMIT,
      include: {
        property: true,
        emailLogs: {
          where: { type: { in: ["BOOKING_CONFIRMATION", "RECEIPT"] }, status: "SENT", ...notAClaim },
          select: { id: true },
          take: 1,
        },
      },
    }),
    Promise.all(VIEWS.map((v) => prisma.booking.count({ where: { ...homeWhere, ...viewWhere(v, todayUtc) } }))),
  ]);

  const threads = bookings.map((booking) => {
    const state = booking.paymentLinkToken ? paymentLinkState(booking) : null;
    const nights = Math.round((booking.checkOutDate.getTime() - booking.checkInDate.getTime()) / DAY_MS);
    return {
      id: booking.id,
      referenceCode: booking.publicReference ?? null,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestCount: booking.guestCount,
      checkInDate: booking.checkInDate.toISOString(),
      checkOutDate: booking.checkOutDate.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      nights,
      status: booking.status,
      displayStatus: displayStatus(booking),
      totalPriceCents: booking.totalPriceCents,
      wasPaid: booking.status === "PAID" || booking.emailLogs.length > 0,
      source: booking.paymentLinkToken ? ("link" as const) : ("checkout" as const),
      // Kept for the cancel control: a PENDING row past its hold is not a booking.
      holdExpired: booking.status === "PENDING" && (state ? state === "expired" : booking.createdAt < pendingHoldCutoff()),
      paymentLink: booking.paymentLinkToken
        ? {
          url: paymentLinkUrl(booking.paymentLinkToken, request.nextUrl.origin),
          state: state!,
          holdUntil: holdUntilLabel(booking, booking.property),
          holdUntilIso: booking.holdUntil?.toISOString() ?? null,
          createdBy: booking.createdByAdmin,
          charges: {
            nightlySubtotalCents: booking.nightlySubtotalCents ?? 0,
            cleaningFeeCents: booking.cleaningFeeCents ?? 0,
            serviceFeeCents: booking.serviceFeeCents ?? 0,
            taxCents: booking.taxCents ?? 0,
          },
        }
        : null,
      property: {
        id: booking.property.id,
        name: booking.property.name,
        slug: booking.property.slug,
        hostSupportEmail: booking.property.hostSupportEmail ?? null,
      },
    };
  });

  return NextResponse.json({
    view: search ? "search" : view,
    counts: Object.fromEntries(VIEWS.map((v, index) => [v, counts[index]])),
    threads,
  });
}
