import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Db = PrismaClient | Prisma.TransactionClient;

// A PENDING booking holds its dates while the guest is on the payment step.
export const PENDING_HOLD_MINUTES = 30;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Stay dates are calendar dates, stored as UTC midnight. Clients must send 'YYYY-MM-DD';
 * the leading date part of an ISO string is accepted for backwards compatibility.
 */
export function parseStayDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const match = DATE_ONLY.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return Number.isNaN(date.getTime()) ? null : date;
}

export const toISODate = (date: Date) => date.toISOString().slice(0, 10);

export function nightsBetween(checkIn: Date, checkOut: Date) {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
}

export function eachNight(checkIn: Date, checkOut: Date) {
  const nights: Date[] = [];
  const cursor = new Date(checkIn);
  while (cursor < checkOut) {
    nights.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return nights;
}

export const pendingHoldCutoff = () => new Date(Date.now() - PENDING_HOLD_MINUTES * 60_000);

type UnavailableOptions = {
  // Ignore these bookings (e.g. the booking being paid for).
  excludeBookingIds?: number[];
  // Ignore this guest's own pending holds so they can restart checkout.
  ignorePendingForEmail?: string;
  // Public calendar/quote views ignore holds; only checkout enforces them.
  includePendingHolds?: boolean;
};

/**
 * Returns every unavailable night (YYYY-MM-DD) for the property in [from, to).
 * Sources: Airbnb iCal + direct blocks, PriceLabs booked/unbookable nights,
 * admin-blocked special rates, PAID bookings, and PENDING bookings still inside their hold.
 */
export async function getUnavailableNights(
  propertyId: number,
  from: Date,
  to: Date,
  options: UnavailableOptions = {},
  db: Db = prisma,
) {
  const range = { gte: from, lt: to };
  const exclude = options.excludeBookingIds ?? [];

  const bookingStatusFilter: Prisma.BookingWhereInput[] = [{ status: "PAID" }];
  if (options.includePendingHolds !== false) {
    bookingStatusFilter.push({
      status: "PENDING",
      createdAt: { gte: pendingHoldCutoff() },
      ...(options.ignorePendingForEmail
        ? { NOT: { guestEmail: { equals: options.ignorePendingForEmail, mode: "insensitive" } } }
        : {}),
    });
  }

  const [blocked, pricingBlocked, specialBlocked, bookings] = await Promise.all([
    db.blockedDate.findMany({ where: { propertyId, date: range }, select: { date: true } }),
    db.propertyPricing.findMany({ where: { propertyId, date: range, isBlocked: true }, select: { date: true } }),
    db.specialRate.findMany({ where: { propertyId, date: range, isBlocked: true }, select: { date: true } }),
    db.booking.findMany({
      where: {
        propertyId,
        id: exclude.length ? { notIn: exclude } : undefined,
        checkInDate: { lt: to },
        checkOutDate: { gt: from },
        OR: bookingStatusFilter,
      },
      select: { checkInDate: true, checkOutDate: true },
    }),
  ]);

  const nights = new Set<string>();
  for (const row of [...blocked, ...pricingBlocked, ...specialBlocked]) {
    nights.add(toISODate(row.date));
  }
  for (const booking of bookings) {
    for (const night of eachNight(booking.checkInDate, booking.checkOutDate)) {
      if (night >= from && night < to) nights.add(toISODate(night));
    }
  }
  return nights;
}

export async function isRangeAvailable(
  propertyId: number,
  checkIn: Date,
  checkOut: Date,
  options: UnavailableOptions = {},
  db: Db = prisma,
) {
  const nights = await getUnavailableNights(propertyId, checkIn, checkOut, options, db);
  return nights.size === 0;
}

/**
 * Runs fn in a transaction holding a per-property advisory lock, so two checkouts
 * for the same property can't both pass the availability check and insert.
 */
export async function withPropertyLock<T>(propertyId: number, fn: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BigInt(7_000_000) + BigInt(propertyId)})`;
      return fn(tx);
    },
    { timeout: 15_000 },
  );
}

/** Block a paid booking's nights as DIRECT so iCal export and PriceLabs see them. */
export async function blockBookingNights(
  booking: { propertyId: number; checkInDate: Date; checkOutDate: Date },
  db: Db = prisma,
) {
  const nights = eachNight(booking.checkInDate, booking.checkOutDate);
  if (!nights.length) return;
  await db.blockedDate.createMany({
    data: nights.map((date) => ({ propertyId: booking.propertyId, date, source: "DIRECT" as const })),
    skipDuplicates: true,
  });
}

export async function releaseBookingNights(
  booking: { propertyId: number; checkInDate: Date; checkOutDate: Date },
  db: Db = prisma,
) {
  await db.blockedDate.deleteMany({
    where: {
      propertyId: booking.propertyId,
      source: "DIRECT",
      date: { gte: booking.checkInDate, lt: booking.checkOutDate },
    },
  });
}
