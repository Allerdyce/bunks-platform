// src/app/api/bookings/route.ts
import { Prisma, Property as PrismaProperty } from '@prisma/client';
import { randomInt, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import {
  isRangeAvailable,
  nightsBetween,
  parseStayDate,
  pendingHoldCutoff,
  withPropertyLock,
} from '@/lib/bookingAvailability';
import { minimumNightsFor } from '@/lib/stayRules';
import { syncAirbnbCalendarIfStale } from '@/lib/icalSync';

export const runtime = 'nodejs';





type CreateBookingBody = {
  propertySlug: string;
  checkIn: string;   // 'YYYY-MM-DD' or ISO
  checkOut: string;  // 'YYYY-MM-DD' or ISO
  guestName: string;
  guestEmail: string;
  guests?: number;
};
type PropertyWithRates = {
  weekdayRate?: number | null;
  weekendRate?: number | null;
  serviceFee?: number | null;
  baseNightlyRate: number;
  cleaningFee: number;
};

const toISODate = (date: Date) => date.toISOString().split('T')[0];

const DEFAULT_ACTIVITY_TIME_SLOT = '16:00';

// Removed unused imports and constants


const BOOKING_REFERENCE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const BOOKING_REFERENCE_LENGTH = 5;
const BOOKING_REFERENCE_INSERT_ATTEMPTS = 5;

let bookingReferenceColumnEnsured = false;
let bookingReferenceColumnPromise: Promise<void> | null = null;

async function ensureBookingReferenceColumn() {
  if (bookingReferenceColumnEnsured) {
    return;
  }

  if (bookingReferenceColumnPromise) {
    return bookingReferenceColumnPromise;
  }

  bookingReferenceColumnPromise = (async () => {
    try {
      const result = await prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'Booking'
            AND column_name = 'publicReference'
        ) AS "exists";
      `;

      const exists = Boolean(result?.[0]?.exists);

      if (!exists) {
        await prisma.$executeRawUnsafe(
          'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "publicReference" VARCHAR(32);'
        );
        await prisma.$executeRawUnsafe(
          'CREATE UNIQUE INDEX IF NOT EXISTS "Booking_publicReference_key" ON "Booking"("publicReference");'
        );
      }

      bookingReferenceColumnEnsured = true;
    } finally {
      bookingReferenceColumnPromise = null;
    }
  })();

  return bookingReferenceColumnPromise;
}

function generateBookingReference() {
  let value = '';
  while (value.length < BOOKING_REFERENCE_LENGTH) {
    const index = randomInt(BOOKING_REFERENCE_CHARSET.length);
    value += BOOKING_REFERENCE_CHARSET[index];
  }
  return value;
}

async function generateUniqueBookingReference() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateBookingReference();
    const existing = await prisma.booking.findUnique({
      where: { publicReference: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }
  throw new Error('Unable to generate unique booking reference');
}

function isBookingReferenceCollision(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== 'P2002') {
    return false;
  }

  const target = error.meta?.target;

  if (typeof target === 'string') {
    return target.includes('publicReference');
  }

  if (Array.isArray(target)) {
    return target.some((value) => typeof value === 'string' && value.includes('publicReference'));
  }

  return false;
}


export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateBookingBody;

    const { propertySlug, checkIn, checkOut, guestName, guestEmail } = body;

    if (!propertySlug || !checkIn || !checkOut || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: 'propertySlug, checkIn, checkOut, guestName, guestEmail are required' },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { slug: propertySlug },
      include: { taxes: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found', propertySlug },
        { status: 404 }
      );
    }



    const checkInDate = parseStayDate(checkIn);
    const checkOutDate = parseStayDate(checkOut);

    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: 'Invalid date format (expected YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: 'checkOut must be after checkIn' },
        { status: 400 }
      );
    }

    // Allow "today" in any US timezone.
    const earliestCheckIn = new Date(Date.now() - 36 * 60 * 60 * 1000);
    if (checkInDate < earliestCheckIn) {
      return NextResponse.json({ error: 'Check-in date is in the past' }, { status: 400 });
    }

    const nights = nightsBetween(checkInDate, checkOutDate);
    const minimumNights = minimumNightsFor(property.slug);

    if (nights < minimumNights) {
      return NextResponse.json(
        {
          error: 'MINIMUM_STAY',
          message: `This property requires a minimum stay of ${minimumNights} nights.`,
          minimumNights,
        },
        { status: 400 }
      );
    }

    const normalizedEmail = guestEmail.trim().toLowerCase();

    // Pull the latest Airbnb calendar before taking payment.
    await syncAirbnbCalendarIfStale(property, 2 * 60_000);

    // Fast pre-check (repeated under the property lock before inserting).
    if (!(await isRangeAvailable(property.id, checkInDate, checkOutDate, { ignorePendingForEmail: normalizedEmail }))) {
      return NextResponse.json(
        { available: false, reason: 'DATES_UNAVAILABLE' },
        { status: 409 }
      );
    }

    // 3) Calculate Pricing using shared logic
    const { calculatePricing } = await import('@/lib/pricing/calculator');
    const partySize = Math.max(1, Math.min(body.guests ?? property.maxGuests ?? 1, property.maxGuests ?? 16));

    // Note: This re-fetches property internally but ensures consistency with frontend quote
    const quote = await calculatePricing(property.slug, checkInDate, checkOutDate, partySize);

    const {
      totalPriceCents,
      nightlySubtotalCents,
      cleaningFeeCents,
      serviceFeeCents,
      taxCents,
      undiscountedNightlySubtotalCents,
      nightlyLineItems
    } = quote;

    // 4) Create booking in DB with PENDING status, holding the dates while the guest pays.
    await ensureBookingReferenceColumn();

    const stripe = getStripeClient();

    type CreatedBooking = Awaited<ReturnType<typeof prisma.booking.create>>;
    let booking: CreatedBooking | null = null;
    let reusedBooking: CreatedBooking | null = null;

    for (let attempt = 0; attempt < BOOKING_REFERENCE_INSERT_ATTEMPTS && !booking; attempt += 1) {
      const candidateReference = await generateUniqueBookingReference();
      try {
        const result = await withPropertyLock(property.id, async (tx) => {
          // Same guest restarting checkout: reuse their hold for identical dates, release other holds.
          const ownHolds = await tx.booking.findMany({
            where: {
              propertyId: property.id,
              status: 'PENDING',
              createdAt: { gte: pendingHoldCutoff() },
              guestEmail: { equals: normalizedEmail, mode: 'insensitive' },
            },
          });
          const sameStay = ownHolds.find(
            (hold) =>
              hold.checkInDate.getTime() === checkInDate.getTime() &&
              hold.checkOutDate.getTime() === checkOutDate.getTime() &&
              hold.totalPriceCents === totalPriceCents &&
              hold.stripePaymentIntentId.startsWith('pi_')
          );
          if (sameStay) {
            return { reused: sameStay };
          }
          if (ownHolds.length) {
            await tx.booking.updateMany({
              where: { id: { in: ownHolds.map((hold) => hold.id) } },
              data: { status: 'CANCELLED' },
            });
          }

          const available = await isRangeAvailable(property.id, checkInDate, checkOutDate, {}, tx);
          if (!available) {
            return { unavailable: true as const };
          }

          const created = await tx.booking.create({
            data: {
              propertyId: property.id,
              checkInDate,
              checkOutDate,
              guestName: guestName.trim(),
              guestEmail: normalizedEmail,
              totalPriceCents,
              status: 'PENDING',
              // Unique placeholder until the PaymentIntent exists.
              stripePaymentIntentId: `pending_${randomUUID()}`,
              publicReference: candidateReference,
            },
          });
          return { created, released: ownHolds };
        });

        if ('unavailable' in result) {
          return NextResponse.json(
            { available: false, reason: 'DATES_UNAVAILABLE' },
            { status: 409 }
          );
        }

        if ('reused' in result && result.reused) {
          reusedBooking = result.reused;
          break;
        }

        booking = result.created;

        // Best effort: cancel PaymentIntents of the holds we released.
        for (const released of result.released) {
          if (released.stripePaymentIntentId.startsWith('pi_')) {
            await stripe.paymentIntents.cancel(released.stripePaymentIntentId).catch(() => undefined);
          }
        }
      } catch (creationError) {
        if (isBookingReferenceCollision(creationError)) {
          console.warn('Booking reference collision detected, retrying');
          continue;
        }
        throw creationError;
      }
    }

    let clientSecret: string | null = null;

    if (reusedBooking) {
      const existingIntent = await stripe.paymentIntents.retrieve(reusedBooking.stripePaymentIntentId);
      if (existingIntent.status !== 'canceled' && existingIntent.status !== 'succeeded') {
        booking = reusedBooking;
        clientSecret = existingIntent.client_secret;
      } else {
        await prisma.booking.update({ where: { id: reusedBooking.id }, data: { status: 'CANCELLED' } });
        return NextResponse.json(
          { error: 'Your previous checkout has expired. Please try again.' },
          { status: 409 }
        );
      }
    }

    if (!booking) {
      console.error('Unable to create booking with a unique reference');
      return NextResponse.json(
        { error: 'We could not start your booking. Please try again.' },
        { status: 500 }
      );
    }

    const bookingReference = booking.publicReference ?? '';

    if (!clientSecret) {
      const paymentMetadata: Record<string, string> = {
        bookingId: booking.id.toString(),
        propertySlug,
        checkIn: checkInDate.toISOString().slice(0, 10),
        checkOut: checkOutDate.toISOString().slice(0, 10),
        guests: partySize.toString(),
        booking_reference: bookingReference,
      };

      try {
        const paymentIntent = await stripe.paymentIntents.create(
          {
            amount: totalPriceCents,
            currency: 'usd',
            receipt_email: normalizedEmail,
            metadata: paymentMetadata,
          },
          { idempotencyKey: `booking-${booking.id}` }
        );

        // 6) Update booking with the PaymentIntent ID
        await prisma.booking.update({
          where: { id: booking.id },
          data: { stripePaymentIntentId: paymentIntent.id },
        });
        clientSecret = paymentIntent.client_secret;
      } catch (stripeError) {
        // Release the hold so the dates aren't blocked by a checkout that can't be paid.
        await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } }).catch(() => undefined);
        throw stripeError;
      }
    }

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      bookingReference,
      clientSecret,
      totalPriceCents,
      currency: 'usd',
      nights: nightlyLineItems.length,
      breakdown: {
        nightlySubtotalCents,
        cleaningFeeCents,
        serviceFeeCents,
        taxCents,
        undiscountedNightlySubtotalCents,
        nightlyLineItems,
      },
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'We could not start your booking. Please try again or contact us.' },
      { status: 500 }
    );
  }
}