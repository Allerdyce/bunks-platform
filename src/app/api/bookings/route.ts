// src/app/api/bookings/route.ts
import type { Prisma, Property as PrismaProperty } from '@prisma/client';
import { randomInt } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import { specialRateClient } from '@/lib/specialRateClient';
import { isFeatureEnabled } from '@/lib/featureFlags';

export const runtime = 'nodejs';

type IncomingAddonSelection = number | {
  id?: number;
  activityDate?: string | null;
  activityTimeSlot?: string | null;
};

type CreateBookingBody = {
  propertySlug: string;
  checkIn: string;   // 'YYYY-MM-DD' or ISO
  checkOut: string;  // 'YYYY-MM-DD' or ISO
  guestName: string;
  guestEmail: string;
  guests?: number;
  addons?: IncomingAddonSelection[];
};

type NormalizedAddonSelection = {
  id: number;
  activityDate?: Date;
  activityTimeSlot?: string | null;
};

function normalizeToMidnight(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffInNights(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diffMs / msPerDay));
}

type PropertyWithRates = {
  weekdayRate?: number | null;
  weekendRate?: number | null;
  serviceFee?: number | null;
  baseNightlyRate: number;
  cleaningFee: number;
};

type SpecialRateRecord = {
  id: number;
  date: Date;
  price: number;
  isBlocked: boolean;
};

const isWeekendNight = (date: Date) => {
  const day = date.getUTCDay();
  return day === 5 || day === 6; // Friday & Saturday nights
};

const toISODate = (date: Date) => date.toISOString().split('T')[0];

const DEFAULT_ACTIVITY_TIME_SLOT = '16:00';

const PROPERTY_MINIMUM_NIGHTS: Record<string, number> = {
  'summerland-ocean-view-beach-bungalow': 3,
  'steamboat-downtown-townhome': 3,
};

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
  if (isNaN(parsed.getTime())) {
    return null;
  }

  return normalizeToMidnight(parsed);
}

function isValidTimeSlot(value?: string | null) {
  if (!value) return false;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizeAddonSelections(addons: IncomingAddonSelection[] | undefined): NormalizedAddonSelection[] {
  if (!Array.isArray(addons) || addons.length === 0) {
    return [];
  }

  const byId = new Map<number, NormalizedAddonSelection>();

  for (const entry of addons) {
    let addonId: number | undefined;

    if (typeof entry === 'number') {
      addonId = entry;
    } else if (entry && typeof entry === 'object' && typeof entry.id === 'number') {
      addonId = entry.id;
    }

    if (!addonId || !Number.isInteger(addonId) || addonId <= 0) {
      continue;
    }

    const normalized: NormalizedAddonSelection = { id: addonId };

    if (typeof entry === 'object' && entry !== null) {
      const activityDate = parseActivityDate(entry.activityDate ?? undefined);
      if (activityDate) {
        normalized.activityDate = activityDate;
      }

      if (typeof entry.activityTimeSlot === 'string' && entry.activityTimeSlot.trim()) {
        normalized.activityTimeSlot = entry.activityTimeSlot.trim();
      }
    }

    byId.set(addonId, normalized);
  }

  return Array.from(byId.values());
}

function resolveAddonSchedule(params: {
  addonTitle: string;
  selection?: NormalizedAddonSelection;
  checkInDate: Date;
  checkOutDate: Date;
}) {
  const { addonTitle, selection, checkInDate, checkOutDate } = params;

  const activityDate = selection?.activityDate
    ? new Date(selection.activityDate.getTime())
    : new Date(checkInDate.getTime());

  if (activityDate < checkInDate || activityDate >= checkOutDate) {
    throw new Error(
      `Activity date for "${addonTitle}" must fall within your stay (${toISODate(checkInDate)}–${toISODate(
        new Date(checkOutDate.getTime() - 24 * 60 * 60 * 1000),
      )}).`,
    );
  }

  const rawTimeSlot = selection?.activityTimeSlot;
  const candidateTime = typeof rawTimeSlot === 'string' ? rawTimeSlot.trim() : undefined;
  const activityTimeSlot = candidateTime && isValidTimeSlot(candidateTime)
    ? candidateTime.slice(0, 5)
    : DEFAULT_ACTIVITY_TIME_SLOT;

  return { activityDate, activityTimeSlot };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateBookingBody;

    const { propertySlug, checkIn, checkOut, guestName, guestEmail } = body;
    const addonsFeatureEnabled = await isFeatureEnabled('addons');
    const normalizedAddonSelections = addonsFeatureEnabled ? normalizeAddonSelections(body.addons) : [];
    const addonIds = normalizedAddonSelections.map((selection) => selection.id);
    const addonSelectionMap = new Map<number, NormalizedAddonSelection>(
      normalizedAddonSelections.map((selection) => [selection.id, selection]),
    );

    if (!propertySlug || !checkIn || !checkOut || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: 'propertySlug, checkIn, checkOut, guestName, guestEmail are required' },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { slug: propertySlug },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found', propertySlug },
        { status: 404 }
      );
    }

    if (addonIds.length > 6) {
      return NextResponse.json(
        { error: 'Too many add-ons requested' },
        { status: 400 }
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

    // 3) Assemble nightly pricing with weekday/weekend overrides + special rates
    const specialRates = (await specialRateClient.findMany({
      where: {
        propertyId: property.id,
        date: {
          gte: checkInDate,
          lt: checkOutDate,
        },
      },
    })) as SpecialRateRecord[];

    const specialByDate = new Map(
      specialRates.map((rate) => [toISODate(rate.date), rate])
    );

    const nightlyLineItems: {
      date: string;
      amountCents: number;
      source: 'SPECIAL' | 'WEEKEND' | 'WEEKDAY';
    }[] = [];

    const propertyWithRates = property as PrismaProperty & PropertyWithRates;

    const weekdayRate = propertyWithRates.weekdayRate ?? propertyWithRates.baseNightlyRate;
    const weekendRate = propertyWithRates.weekendRate ?? propertyWithRates.baseNightlyRate;
    const cleaningFeeCents = propertyWithRates.cleaningFee ?? 8500;
    const serviceFeeCents = propertyWithRates.serviceFee ?? 2000;

    const cursor = new Date(checkInDate);
    while (cursor < checkOutDate) {
      const isoDate = toISODate(cursor);
      const special = specialByDate.get(isoDate);

      if (special?.isBlocked) {
        return NextResponse.json(
          { available: false, reason: 'DATES_BLOCKED' },
          { status: 409 }
        );
      }

      const source = special
        ? 'SPECIAL'
        : isWeekendNight(cursor)
          ? 'WEEKEND'
          : 'WEEKDAY';

      const amountCents = special
        ? special.price
        : isWeekendNight(cursor)
          ? weekendRate
          : weekdayRate;

      nightlyLineItems.push({ date: isoDate, amountCents, source });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const nightlySubtotalCents = nightlyLineItems.reduce((sum, item) => sum + item.amountCents, 0);

    const selectedAddons = addonIds.length && addonsFeatureEnabled
      ? await prisma.addon.findMany({
          where: {
            id: { in: addonIds },
            propertyId: property.id,
            isActive: true,
          },
        })
      : [];

    if (selectedAddons.length !== addonIds.length) {
      return NextResponse.json(
        { error: 'One or more add-ons are invalid for this property' },
        { status: 400 }
      );
    }

    const resolvedAddonSchedules = new Map<number, { activityDate: Date; activityTimeSlot: string }>();

    for (const addon of selectedAddons) {
      try {
        const resolved = resolveAddonSchedule({
          addonTitle: addon.title,
          selection: addonSelectionMap.get(addon.id),
          checkInDate,
          checkOutDate,
        });
        resolvedAddonSchedules.set(addon.id, resolved);
      } catch (scheduleError: any) {
        return NextResponse.json(
          {
            error:
              scheduleError instanceof Error
                ? scheduleError.message
                : 'Invalid activity scheduling details provided for an add-on',
          },
          { status: 400 }
        );
      }
    }

    const addonsTotalCents = selectedAddons.reduce((sum, addon) => sum + addon.basePriceCents, 0);

    const partySize = Math.max(1, Math.min(body.guests ?? property.maxGuests ?? 1, property.maxGuests ?? 16));

    const totalPriceCents = nightlySubtotalCents + cleaningFeeCents + serviceFeeCents + addonsTotalCents;

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

          if (addonsFeatureEnabled && selectedAddons.length) {
            await tx.bookingAddon.createMany({
              data: selectedAddons.map((addon) => ({
                bookingId: createdBooking.id,
                addonId: addon.id,
                finalPriceCents: addon.basePriceCents,
                providerStatus: 'pending-provider',
                activityDate: resolvedAddonSchedules.get(addon.id)?.activityDate ?? checkInDate,
                activityTimeSlot:
                  resolvedAddonSchedules.get(addon.id)?.activityTimeSlot ?? DEFAULT_ACTIVITY_TIME_SLOT,
              })),
            });
          }

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

    if (addonsFeatureEnabled && selectedAddons.length) {
      paymentMetadata.addon_ids = selectedAddons.map((addon) => addon.id).join(',');
      paymentMetadata.addon_titles = selectedAddons.map((addon) => addon.title).join('|').slice(0, 400);
      paymentMetadata.addons_total_cents = addonsTotalCents.toString();
    }
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
        nightlyLineItems,
        addonsTotalCents,
        addonLineItems: selectedAddons.map((addon) => ({
          id: addon.id,
          title: addon.title,
          priceCents: addon.basePriceCents,
          provider: addon.provider,
          status: 'pending-provider',
          confirmationCode: null,
          activityDate:
            resolvedAddonSchedules.get(addon.id)?.activityDate?.toISOString() ?? checkInDate.toISOString(),
          activityTimeSlot:
            resolvedAddonSchedules.get(addon.id)?.activityTimeSlot ?? DEFAULT_ACTIVITY_TIME_SLOT,
        })),
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
  }
}