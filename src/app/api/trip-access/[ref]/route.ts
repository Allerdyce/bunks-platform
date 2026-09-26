import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { TripAccessCodes, TripAccessResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOKING_REFERENCE_PATTERN = /^[A-Z0-9]{5}$/;
const RELEASE_WINDOW_MS = 24 * 60 * 60 * 1000;
// Booking dates are stored as calendar dates (midnight UTC). Keep codes available through the
// end of the check-out day so guests aren't locked out the evening before or morning of departure.
const CHECKOUT_GRACE_MS = 24 * 60 * 60 * 1000;

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

function normalizeBookingReference(rawValue: string | undefined) {
  if (!rawValue) return null;
  const alphanumeric = rawValue.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (!BOOKING_REFERENCE_PATTERN.test(alphanumeric)) {
    return null;
  }
  return alphanumeric;
}

const unavailable = (body: TripAccessResponse = { available: false }) =>
  NextResponse.json(body, { headers: NO_STORE_HEADERS });

/**
 * Door/lock codes for a confirmed guest. Requires booking reference + guest email, a PAID booking,
 * and the current time to be within [check-in - 24h, end of check-out day].
 */
export async function GET(req: NextRequest, context: { params: Promise<{ ref: string }> }) {
  try {
    const { ref } = await context.params;
    const bookingReference = normalizeBookingReference(ref);
    const email = req.nextUrl.searchParams.get("email")?.trim();

    if (!bookingReference || !email) {
      return NextResponse.json({ error: "bookingReference and email are required" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const booking = await prisma.booking.findUnique({
      where: { publicReference: bookingReference },
      select: {
        guestEmail: true,
        status: true,
        checkInDate: true,
        checkOutDate: true,
        property: {
          select: {
            garageCode: true,
            lockboxCode: true,
            skiLockerDoorCode: true,
            skiLockerNumber: true,
            skiLockerCode: true,
          },
        },
      },
    });

    if (!booking || booking.guestEmail.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    if (booking.status !== "PAID") {
      return unavailable();
    }

    const now = Date.now();
    const releasesAt = booking.checkInDate.getTime() - RELEASE_WINDOW_MS;
    const expiresAt = booking.checkOutDate.getTime() + CHECKOUT_GRACE_MS;

    if (now < releasesAt) {
      return unavailable({ available: false, releasesAt: new Date(releasesAt).toISOString() });
    }
    if (now > expiresAt) {
      return unavailable();
    }

    const { property } = booking;
    const codes: TripAccessCodes = {
      garageCode: property.garageCode ?? null,
      lockboxCode: property.lockboxCode ?? null,
      skiLockerDoorCode: property.skiLockerDoorCode ?? null,
      skiLockerNumber: property.skiLockerNumber ?? null,
      skiLockerCode: property.skiLockerCode ?? null,
    };

    return NextResponse.json({ available: true, codes } satisfies TripAccessResponse, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Failed to load trip access codes", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
