// src/app/api/bookings/route.ts
import { Prisma, Property as PrismaProperty } from '@prisma/client';
import { randomInt } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { PriceLabsService } from '@/lib/pricelabs/service';

export const runtime = 'nodejs';



function normalizeToMidnight(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffInNights(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diffMs / msPerDay));
}

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

const PROPERTY_MINIMUM_NIGHTS: Record<string, number> = {
  'summerland-ocean-view-beach-bungalow': 3,
  'steamboat-downtown-townhome': 3,
};
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

function parseActivityDate(value?: string | null) {
  if (!value) return null;
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number.parseInt(yearStr ?? "", 10);
  const month = Number.parseInt(monthStr ?? "", 10);
  const day = Number.parseInt(dayStr ?? "", 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);

  return normalizeToMidnight(parsed);
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
      // @ts-ignore
      include: { taxes: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found', propertySlug },
        { status: 404 }
      );
    }



    const checkInDate = normalizeToMidnight(new Date(checkIn));
    const checkOutDate = normalizeToMidnight(new Date(checkOut));

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: 'checkOut must be after checkIn' },
        { status: 400 }
      );
    }

    const nights = diffInNights(checkInDate, checkOutDate);
    const minimumNights = PROPERTY_MINIMUM_NIGHTS[property.slug] ?? 1;

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

    // 1) Check blocked dates (from Airbnb + DIRECT)
    const anyBlocked = await prisma.blockedDate.findFirst({
      where: {
        propertyId: property.id,
        date: {
          gte: checkInDate,
          lt: checkOutDate,
        },
      },
    });

    if (anyBlocked) {
      return NextResponse.json(
        { available: false, reason: 'DATES_BLOCKED' },
        { status: 409 }
      );
    }

    // 2) Check overlapping paid bookings (belt & braces)
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        propertyId: property.id,
        status: 'PAID',
        // overlap: start < requested end AND end > requested start
        checkInDate: { lt: checkOutDate },
        checkOutDate: { gt: checkInDate },
      },
    });

    if (overlappingBooking) {
      return NextResponse.json(
        { available: false, reason: 'EXISTING_BOOKING' },
        { status: 409 }
      );
    }

    // 3) Calculate Pricing using shared logic
    const { calculatePricing } = await import('@/lib/pricing/calculator');
    const partySize = Math.max(1, Math.min(body.guests ?? property.maxGuests ?? 1, property.maxGuests ?? 16));

    // Note: This re-fetches property internally but ensures consistency with frontend quote
    const quote = await calculatePricing(property.slug, checkInDate, checkOutDate, partySize);

    // Check min stay (using check-in date rules from PriceLabs if available in Quote?)
    // Our calculator returns `nightlyLineItems`. We can inspect the first one if we want deep validation,
    // but `calculatePricing` doesn't currently return minStay rules.
    // The original code did: `const checkInPricing = priceLabsByDate.get(toISODate(checkInDate));`
    // We should probably MOVE min stay check INTO calculator or expose PriceLabs data from it.
    // For now, let's keep the PriceLabs min stay check if possible, or assume calculator handles "validity"?
    // Calculator DOES NOT validate min stay.
    // I should add Min Stay validation to `calculatePricing` or return the raw data needed.
    // Or I can re-query existing logic?
    // The previous code queried `propertyPricing` manually.
    // IMPORTANT: The user wants PRICING to be correct.
    // Min stay rules are critical too.
    // I can leave the Min Stay check (lines 263-294) but purely for validation, then use calculator for price.
    // Actually, `calculatePricing` uses `PropertyPricing` table.
    // If I remove the query here, I lose the local `priceLabsRates` variable used for Min Stay check.
    // I should Update `calculatePricing` to return minStay requirements or validate them.
    // BUT, for now, to minimize risk of breaking validation, I will duplicatedly fetch for validation or just rely on the existing fetch if I keep it?
    // No, I want to remove the duplicate pricing logic.
    // Let's use `calculatePricing` for the MONEY part.
    // I will KEEP the `PropertyPricing` fetch for VALIDATION (Min Stay) for now, but use `calculatePricing` for the TOTAL.
    // Or better: Let's trust the logic I just wrote? No, `calculatePricing` returns a Quote, not validation.

    // Re-fetch for validation (lightweight) or just accept the double fetch cost for correctness.
    let minStay = PROPERTY_MINIMUM_NIGHTS[property.slug] ?? 1;
    if ((prisma as any).propertyPricing) {
      const checkInPrice = await (prisma as any).propertyPricing.findUnique({
        where: {
          propertyId_date: {
            propertyId: property.id,
            date: checkInDate
          }
        }
      });
      if (checkInPrice?.minNights) {
        minStay = checkInPrice.minNights;
      }
    }

    if (nights < minStay) {
      return NextResponse.json(
        {
          error: 'MINIMUM_STAY',
          message: `This property requires a minimum stay of ${minStay} nights.`,
          minimumNights: minStay,
        },
        { status: 400 }
      );
    }

    const {
      totalPriceCents,
      nightlySubtotalCents,
      cleaningFeeCents,
      serviceFeeCents,
      taxCents,
      undiscountedNightlySubtotalCents,
      nightlyLineItems
    } = quote;

    // 4) Create booking in DB with PENDING status
    await ensureBookingReferenceColumn();

    type CreatedBooking = Awaited<ReturnType<typeof prisma.booking.create>>;
    let booking: CreatedBooking | null = null;
    let bookingReference: string | null = null;

    for (let attempt = 0; attempt < BOOKING_REFERENCE_INSERT_ATTEMPTS; attempt += 1) {
      const candidateReference = await generateUniqueBookingReference();
      try {
        booking = await prisma.$transaction(async (tx) => {
          const createdBooking = await tx.booking.create({
            data: {
              propertyId: property.id,
              checkInDate,
              checkOutDate,
              guestName,
              guestEmail,
              totalPriceCents,
              status: 'PENDING',
              stripePaymentIntentId: '',
              publicReference: candidateReference,
            },
          });



          return createdBooking;
        });

        bookingReference = booking.publicReference ?? candidateReference;
        break;
      } catch (creationError) {
        if (isBookingReferenceCollision(creationError)) {
          console.warn('Booking reference collision detected, retrying');
          continue;
        }
        throw creationError;
      }
    }

    if (!booking || !bookingReference) {
      console.error('Unable to create booking with a unique reference');
      return NextResponse.json(
        { error: 'Internal server error', details: 'Unable to assign booking reference. Please try again.' },
        { status: 500 }
      );
    }

    const stripe = getStripeClient();

    const paymentMetadata: Record<string, string> = {
      bookingId: booking.id.toString(),
      propertySlug,
      checkIn: checkInDate.toISOString(),
      checkOut: checkOutDate.toISOString(),
    };


    paymentMetadata.guests = partySize.toString();

    paymentMetadata.booking_reference = bookingReference;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPriceCents,
      currency: 'usd',
      receipt_email: guestEmail,
      metadata: paymentMetadata,
    });

    // 6) Update booking with the PaymentIntent ID
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    // PriceLabs Sync
    try {
      if (booking) {
        // Sync reservation
        await PriceLabsService.syncReservation(booking);
        // Sync availability (blocks dates)
        await PriceLabsService.syncCalendar(booking.propertyId);
      }
    } catch (plError) {
      console.error('Failed to sync new booking to PriceLabs', plError);
      // Do not fail the request
    }

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      bookingReference,
      clientSecret: paymentIntent.client_secret,
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
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: String(error?.message ?? error),
      },
      { status: 500 }
    );
  } finally {
    // PriceLabs Sync (Async, Fire-and-forget-ish but we are in serverless return 
    // so we can't really await if we want speed, but Vercel might kill it. 
    // Best practice: await it if critical.
    // Also valid: It's inside the POST handler, so we can await before return or 
    // use waitUntil if available (Next 15?). Here we just await inside the try block 
    // BUT I put it in `finally`? No, `booking` might be null if failed.
  }
}