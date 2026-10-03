import "server-only";

import { prisma } from "@/lib/prisma";
import { getUnavailableNights, parseStayDate, toISODate } from "@/lib/bookingAvailability";
import { minimumNightsFor, propertyToday, resolvePropertyTimeZone } from "@/lib/stayRules";
import { isFeatureEnabled } from "@/lib/featureFlags";

// Airbnb-driven nightly rates. Airbnb is the rule: the price runner quotes short stays on each
// home's source Airbnb listing, Bunks backs the nightly rate out of each quote and saves it as a
// date override (SpecialRate, note AUTO_NOTE). Checkout then applies Bunks' 10% discount to it.
//
//   nightly = (quote ÷ (1 + Airbnb guest fee) − Airbnb cleaning fee) ÷ nights
//
// - A date override entered by hand (any other note, or a blocked date) always wins.
// - Automatic rates older than AUTO_RATE_MAX_AGE_MS are ignored by checkout, which falls back
//   to the base rates in Admin → Pricing.
// - Nothing is saved until AIRBNB_GUEST_FEE_PCT is set (14.1 for Airbnb's split fee, 0 for a
//   host-only fee) and the "Price homes from Airbnb" switch in Admin → Pricing is on. Otherwise the
//   price check only compares, and checkout uses the base rates.
// - While on, a night with no current Airbnb (or manual) rate can't be booked online: there is no
//   fallback to the base rates, because Airbnb is the rule.

export const AUTO_NOTE = "auto:airbnb";
export const AUTO_RATE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// A night is re-quoted once its automatic rate is older than this.
const REFRESH_AFTER_MS = 20 * 60 * 60 * 1000;
const HORIZON_DAYS = 180;
const MIN_NIGHTLY_CENTS = 5_000;
const MAX_NIGHTLY_CENTS = 500_000;
const DAY_MS = 86_400_000;

/** The Airbnb listing each home copies, and that listing's cleaning fee on Airbnb. */
export const AIRBNB_RATE_SOURCES: Record<string, { listingId: string; cleaningCents: number }> = {
  "steamboat-downtown-townhome": { listingId: "1552191060469626901", cleaningCents: 25_000 },
  // "Briggs Direct" is the rule for Summerland.
  "summerland-ocean-view-beach-bungalow": { listingId: "1734161844121212601", cleaningCents: 27_500 },
};

/** Airbnb's guest service fee as a fraction (0.141 for 14.1%), or null when not configured. */
export function airbnbGuestFee(): number | null {
  const raw = process.env.AIRBNB_GUEST_FEE_PCT;
  if (raw === undefined || raw.trim() === "") return null;
  const pct = Number(raw);
  return Number.isFinite(pct) && pct >= 0 && pct < 50 ? pct / 100 : null;
}

/** On when Airbnb's fee is configured and the "Price homes from Airbnb" switch (Admin → Pricing) is on. */
export async function autoRatesEnabled() {
  return airbnbGuestFee() !== null && (await isFeatureEnabled("airbnbPricing"));
}

/** Homes whose price comes only from Airbnb (no fallback to the base rates in Admin → Pricing). */
export async function pricedFromAirbnb(slug: string) {
  return Boolean(AIRBNB_RATE_SOURCES[slug]) && (await autoRatesEnabled());
}

export const PRICE_UNAVAILABLE_MESSAGE =
  "We don't have a price for these dates yet. Please try other dates, or email us and we'll quote you directly.";

/** Thrown when a home is priced from Airbnb and some nights have no current Airbnb rate. */
export class PriceUnavailableError extends Error {
  constructor(public readonly nights: string[]) {
    super(PRICE_UNAVAILABLE_MESSAGE);
    this.name = "PriceUnavailableError";
  }
}

export function isAutoRate(row: { note?: string | null; isBlocked?: boolean }) {
  return row.note === AUTO_NOTE && !row.isBlocked;
}

/** True when checkout may use this date override (manual ones always; automatic ones while fresh). */
export function isUsableSpecialRate(row: { note?: string | null; isBlocked?: boolean; updatedAt?: Date }, now = Date.now()) {
  if (!isAutoRate(row)) return true;
  return !!row.updatedAt && now - row.updatedAt.getTime() <= AUTO_RATE_MAX_AGE_MS;
}

/** Nightly rate in cents backed out of an all-in (fees included, pre-tax) Airbnb quote. */
export function deriveNightlyCents(quoteCents: number, nights: number, cleaningCents: number, guestFee: number) {
  if (nights < 1) return null;
  const nightly = Math.round((quoteCents / (1 + guestFee) - cleaningCents) / nights);
  return nightly >= MIN_NIGHTLY_CENTS && nightly <= MAX_NIGHTLY_CENTS ? nightly : null;
}

export type RateWindow = { slug: string; listingId: string; checkIn: string; checkOut: string; priority: number };

type PlannerProperty = { id: number; slug: string; timezone: string | null; airbnbIcalUrl: string };

/**
 * The 3-night windows to quote next for a home, oldest-priced first. Covers every open night in
 * the next HORIZON_DAYS that isn't priced by hand and whose automatic rate is missing or due.
 * Nights in gaps shorter than the minimum stay are skipped: they can't be booked anyway.
 */
export async function planRateWindows(property: PlannerProperty, listingIds: string[], now = new Date()): Promise<RateWindow[]> {
  const source = AIRBNB_RATE_SOURCES[property.slug];
  if (!source || !listingIds.includes(source.listingId)) return [];
  const length = Math.max(3, minimumNightsFor(property.slug));
  const start = new Date(propertyToday(resolvePropertyTimeZone(property), now).getTime() + DAY_MS);
  const end = new Date(start.getTime() + HORIZON_DAYS * DAY_MS);

  const [unavailable, overrides] = await Promise.all([
    getUnavailableNights(property.id, start, end, { includePendingHolds: false }),
    prisma.specialRate.findMany({
      where: { propertyId: property.id, date: { gte: start, lt: end } },
      select: { date: true, note: true, isBlocked: true, updatedAt: true },
    }),
  ]);
  const manual = new Set<string>();
  const autoUpdated = new Map<string, number>();
  for (const row of overrides) {
    const key = toISODate(row.date);
    if (isAutoRate(row)) autoUpdated.set(key, row.updatedAt.getTime());
    else manual.add(key);
  }

  // Consecutive open nights, tiled into windows (the last one aligned to the gap's end).
  const nights: string[] = [];
  for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) nights.push(toISODate(new Date(t)));
  const gaps: string[][] = [];
  let current: string[] = [];
  for (const night of nights) {
    if (unavailable.has(night)) {
      if (current.length) gaps.push(current);
      current = [];
    } else {
      current.push(night);
    }
  }
  if (current.length) gaps.push(current);

  const windows: RateWindow[] = [];
  for (const gap of gaps) {
    if (gap.length < length) continue;
    const starts: number[] = [];
    for (let i = 0; i + length <= gap.length; i += length) starts.push(i);
    if (starts[starts.length - 1] + length < gap.length) starts.push(gap.length - length);
    for (const i of starts) {
      const windowNights = gap.slice(i, i + length);
      const due = windowNights.filter(
        (night) => !manual.has(night) && now.getTime() - (autoUpdated.get(night) ?? 0) > REFRESH_AFTER_MS,
      );
      if (!due.length) continue;
      const checkOut = toISODate(new Date(parseStayDate(windowNights[windowNights.length - 1])!.getTime() + DAY_MS));
      windows.push({
        slug: property.slug,
        listingId: source.listingId,
        checkIn: windowNights[0],
        checkOut,
        // Oldest (or never) priced first; earlier dates break ties.
        priority: Math.min(...due.map((night) => autoUpdated.get(night) ?? 0)),
      });
    }
  }
  return windows.sort((a, b) => a.priority - b.priority || a.checkIn.localeCompare(b.checkIn));
}

export type RateChange = {
  slug: string;
  checkIn: string;
  checkOut: string;
  nightlyCents: number;
  previousCents: number | null;
  skippedManual: number;
};

/**
 * Saves the nightly rate backed out of an ok Airbnb quote for each of its nights, unless a night
 * has a manual override. Returns what changed, or a reason when the quote couldn't be used.
 */
export async function applyAutoRate(
  property: { id: number; slug: string },
  stay: { listingId: string; checkIn: string; checkOut: string },
  quoteCents: number,
): Promise<RateChange | { slug: string; checkIn: string; checkOut: string; error: string } | null> {
  const source = AIRBNB_RATE_SOURCES[property.slug];
  const guestFee = airbnbGuestFee();
  if (!source || guestFee === null || stay.listingId !== source.listingId || !(await autoRatesEnabled())) return null;
  const checkIn = parseStayDate(stay.checkIn)!;
  const checkOut = parseStayDate(stay.checkOut)!;
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
  const nightlyCents = deriveNightlyCents(quoteCents, nights, source.cleaningCents, guestFee);
  if (nightlyCents === null) {
    return { slug: property.slug, checkIn: stay.checkIn, checkOut: stay.checkOut, error: "Derived nightly rate outside $50–$5,000; not saved." };
  }

  const existing = await prisma.specialRate.findMany({
    where: { propertyId: property.id, date: { gte: checkIn, lt: checkOut } },
    select: { date: true, price: true, note: true, isBlocked: true },
  });
  const byDate = new Map(existing.map((row) => [toISODate(row.date), row]));
  let skippedManual = 0;
  let previousCents: number | null = null;
  for (let t = checkIn.getTime(); t < checkOut.getTime(); t += DAY_MS) {
    const date = new Date(t);
    const row = byDate.get(toISODate(date));
    if (row && !isAutoRate(row)) {
      skippedManual += 1;
      continue;
    }
    previousCents ??= row?.price ?? null;
    await prisma.specialRate.upsert({
      where: { propertyId_date: { propertyId: property.id, date } },
      create: { propertyId: property.id, date, price: nightlyCents, note: AUTO_NOTE },
      // Always written, so updatedAt records when Airbnb last confirmed the rate.
      update: { price: nightlyCents, note: AUTO_NOTE, isBlocked: false },
    });
  }
  return { slug: property.slug, checkIn: stay.checkIn, checkOut: stay.checkOut, nightlyCents, previousCents, skippedManual };
}
