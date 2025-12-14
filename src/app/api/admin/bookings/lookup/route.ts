import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/adminAuth";

const BOOKING_REFERENCE_PATTERN = /^[A-Z0-9]{5}$/;

const normalizeBookingReference = (value?: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toUpperCase();
  if (!BOOKING_REFERENCE_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed;
};

const parseBookingId = (value?: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

export async function POST(request: NextRequest) {
  const session = withAdminAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { bookingId?: unknown; bookingReference?: unknown };
  try {
    payload = (await request.json()) as { bookingId?: unknown; bookingReference?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const bookingId = parseBookingId(payload.bookingId);
  const bookingReference = normalizeBookingReference(payload.bookingReference);

  if (!bookingId && !bookingReference) {
    return NextResponse.json({ error: "Provide a bookingId or bookingReference" }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: bookingId ? { id: bookingId } : { publicReference: bookingReference ?? undefined },
    include: { property: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({
    booking: {
      id: booking.id,
      referenceCode: booking.publicReference ?? null,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      checkInDate: booking.checkInDate.toISOString(),
      checkOutDate: booking.checkOutDate.toISOString(),
      property: {
        id: booking.property.id,
        name: booking.property.name,
        hostSupportEmail: booking.property.hostSupportEmail ?? null,
      },
    },
  });
}
