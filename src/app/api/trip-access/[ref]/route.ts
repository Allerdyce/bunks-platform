import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { tripAccessWindow } from "@/lib/tripAccessWindow";
import type { TripAccessCodes, TripAccessResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOKING_REFERENCE_PATTERN = /^[A-Z0-9]{5}$/;

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
 * Door/lock codes for a confirmed guest: POST { email } to /api/trip-access/<reference>. Requires a
 * PAID booking and the current time to be within [check-in - 24h, end of check-out day].
 */
export async function POST(req: NextRequest, context: { params: Promise<{ ref: string }> }) {
  const limited = rateLimitResponse(req, "trip-lookup", 30, 10 * 60_000);
  if (limited) return limited;

  try {
    const { ref } = await context.params;
    const bookingReference = normalizeBookingReference(ref);
    const body = (await req.json().catch(() => ({}))) as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim() : "";

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

    const now = new Date();
    const { opensAt, closesAt } = tripAccessWindow(booking);
    if (now < opensAt) {
      return unavailable({ available: false, releasesAt: opensAt.toISOString() });
    }
    if (now > closesAt) {
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
