import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const BOOKING_REFERENCE_PATTERN = /^[A-Z0-9]{5}$/;

function normalizeBookingReference(rawValue: string | undefined) {
  if (!rawValue) return null;
  const alphanumeric = rawValue.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (!BOOKING_REFERENCE_PATTERN.test(alphanumeric)) {
    return null;
  }
  return alphanumeric;
}

export async function GET(
  req: NextRequest,
  context: { params: { bookingId?: string } } | { params: Promise<{ bookingId?: string }> },
) {
  try {
    const resolvedParams = typeof (context.params as Promise<{ bookingId?: string }>).then === "function"
      ? await (context.params as Promise<{ bookingId?: string }>)
      : (context.params as { bookingId?: string });

    const bookingReference = normalizeBookingReference(resolvedParams?.bookingId);
    const email = req.nextUrl.searchParams.get("email");

    if (!bookingReference || !email) {
      return NextResponse.json({ error: "bookingReference and email are required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { publicReference: bookingReference },
      include: {
        property: true,
      },
    });

    if (!booking || booking.guestEmail.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        referenceCode: booking.publicReference ?? bookingReference,
        status: booking.status,
        checkInDate: booking.checkInDate.toISOString(),
        checkOutDate: booking.checkOutDate.toISOString(),
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        totalPriceCents: booking.totalPriceCents,
        property: {
          id: booking.property.id,
          name: booking.property.name,
          slug: booking.property.slug,
          timezone: booking.property.timezone,
          checkInGuideUrl: booking.property.checkInGuideUrl ?? null,
          guestBookUrl: booking.property.guestBookUrl ?? null,
          hostSupportEmail: booking.property.hostSupportEmail ?? null,
        },
      },
    });
  } catch (error) {
    console.error("Failed to load booking details", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
