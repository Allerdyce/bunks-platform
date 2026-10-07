import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { guideUrlForBooking, signedGuidePath } from "@/lib/guideLinks";
import { mapsUrlFor, privateDetailsFor, wifiFor } from "@/lib/privatePropertyDetails";
import { isTripAccessOpen, tripAccessWindow } from "@/lib/tripAccessWindow";
import type { BookingPrivateDetails } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

const BOOKING_REFERENCE_PATTERN = /^[A-Z0-9]{5}$/;

function normalizeBookingReference(rawValue: string | undefined) {
  if (!rawValue) return null;
  const alphanumeric = rawValue.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (!BOOKING_REFERENCE_PATTERN.test(alphanumeric)) {
    return null;
  }
  return alphanumeric;
}

/** Trip lookup: POST { email } to /api/bookings/<reference>. The email stays out of URLs and logs. */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ bookingId: string }> },
) {
  const limited = rateLimitResponse(req, "trip-lookup", 30, 10 * 60_000);
  if (limited) return limited;

  try {
    const resolvedParams = await context.params;

    const bookingReference = normalizeBookingReference(resolvedParams?.bookingId);
    const body = (await req.json().catch(() => ({}))) as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim() : "";

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
      return NextResponse.json({ error: "Booking not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    // The address, Wi-Fi, directions and guide PDFs only go to guests with a paid booking.
    let secure: BookingPrivateDetails | null = null;
    if (booking.status === "PAID") {
      const details = privateDetailsFor(booking.property.slug);
      const wifi = wifiFor(booking.property.slug, booking.property);
      secure = {
        address: details?.address ?? null,
        buildingName: details?.buildingName ?? null,
        mapsUrl: details ? mapsUrlFor(details.address) : null,
        wifiSsid: wifi?.ssid ?? null,
        wifiPassword: wifi?.password ?? null,
        parkingNotes: booking.property.parkingNotes?.trim() || details?.parkingNotes || null,
        directions: details?.directions ?? [],
        skiLockerNotes: details?.skiLockerNotes ?? null,
        // The house guide has the door codes in it: shown from 24 hours before check-in.
        guideUrl: isTripAccessOpen(booking)
          ? guideUrlForBooking(booking, booking.property.checkInGuideUrl, booking.property.guestBookUrl)
          : null,
        guideOpensAt: isTripAccessOpen(booking) ? null : tripAccessWindow(booking).opensAt.toISOString(),
        brochureUrl: signedGuidePath(booking, "brochure"),
      };
    }

    return NextResponse.json(
      {
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
            hostSupportEmail: booking.property.hostSupportEmail ?? null,
            checkInTime: booking.property.checkInTime ?? null,
            checkOutTime: booking.property.checkOutTime ?? null,
          },
          secure,
        },
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error("Failed to load booking details", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
