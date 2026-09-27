import "server-only";

import crypto from "crypto";
import * as ical from "ical";
import { prisma } from "@/lib/prisma";
import { eachNight, toISODate, withPropertyLock } from "@/lib/bookingAvailability";

type SyncableProperty = { id: number; slug: string; airbnbIcalUrl: string | null };

const PLACEHOLDER_ICAL_HOSTS = ["calendarlabs.com"];
const lastSyncedAt = new Map<number, number>();

const toUtcDay = (value: Date) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
const DAY_MS = 86_400_000;

// `ical` builds all-day (VALUE=DATE) values as *local* midnight, so read the local date parts;
// timed values are real instants, so read the UTC date.
type IcalDate = Date & { dateOnly?: boolean };
const toStayDay = (value: IcalDate) =>
  value.dateOnly
    ? new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()))
    : toUtcDay(new Date(value));

export class IcalSyncError extends Error {
  constructor(
    message: string,
    readonly reason: "FETCH_FAILED" | "MALFORMED_FEED" | "EMPTY_FEED",
  ) {
    super(message);
  }
}

export function isUsableIcalUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const { hostname, protocol } = new URL(url);
    return protocol.startsWith("http") && !PLACEHOLDER_ICAL_HOSTS.some((host) => hostname.endsWith(host));
  } catch {
    return false;
  }
}

/** Parses an iCal feed into booked nights (YYYY-MM-DD). Throws on anything that looks incomplete. */
export function parseIcalNights(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("BEGIN:VCALENDAR") || !/END:VCALENDAR$/.test(trimmed)) {
    throw new IcalSyncError("Calendar feed is incomplete (missing BEGIN/END:VCALENDAR)", "MALFORMED_FEED");
  }
  const declaredEvents = (trimmed.match(/^BEGIN:VEVENT\s*$/gm) ?? []).length;
  const closedEvents = (trimmed.match(/^END:VEVENT\s*$/gm) ?? []).length;
  const events = Object.values(ical.parseICS(trimmed)).filter((event) => event?.type === "VEVENT");
  if (declaredEvents !== closedEvents || events.length !== declaredEvents) {
    throw new IcalSyncError(
      `Calendar feed has ${declaredEvents} events but ${events.length} parsed; refusing to import`,
      "MALFORMED_FEED",
    );
  }

  const nights = new Set<string>();
  for (const event of events) {
    if (!event.start || Number.isNaN(new Date(event.start).getTime())) {
      throw new IcalSyncError(`Calendar event ${event.uid ?? ""} has no valid start date`, "MALFORMED_FEED");
    }
    const start = toStayDay(event.start as IcalDate);
    // A missing DTEND on an all-day event means a single day.
    const end = event.end ? toStayDay(event.end as IcalDate) : new Date(start.getTime() + DAY_MS);
    for (const night of eachNight(start, end > start ? end : new Date(start.getTime() + DAY_MS))) {
      nights.add(toISODate(night));
    }
  }
  return nights;
}

/**
 * Imports the Airbnb calendar into BlockedDate(AIRBNB). The replace is atomic and runs under the
 * property's booking lock. A failed, malformed or suspiciously empty fetch leaves the existing
 * blocks untouched: an empty feed only replaces future Airbnb blocks when `allowEmpty` is set
 * (an admin confirming it in Setup).
 */
export async function syncAirbnbCalendar(property: SyncableProperty, options: { allowEmpty?: boolean } = {}) {
  if (!isUsableIcalUrl(property.airbnbIcalUrl)) {
    return { ok: false as const, reason: "NO_ICAL_URL" };
  }

  let text = "";
  try {
    const res = await fetch(property.airbnbIcalUrl, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    text = res.ok ? await res.text() : "";
    if (!res.ok || !text.includes("BEGIN:VCALENDAR")) {
      throw new IcalSyncError(`Airbnb iCal fetch failed for ${property.slug} (HTTP ${res.status})`, "FETCH_FAILED");
    }
  } catch (error) {
    recordSyncFailure(property.id);
    if (error instanceof IcalSyncError) throw error;
    throw new IcalSyncError(`Airbnb iCal fetch failed for ${property.slug}: ${(error as Error).message}`, "FETCH_FAILED");
  }

  let nights: Set<string>;
  try {
    nights = parseIcalNights(text);
  } catch (error) {
    recordSyncFailure(property.id);
    throw error;
  }

  const today = toISODate(toUtcDay(new Date()));
  const futureNights = Array.from(nights).filter((night) => night >= today).length;

  await withPropertyLock(property.id, async (tx) => {
    if (futureNights === 0 && !options.allowEmpty) {
      const existingFuture = await tx.blockedDate.count({
        where: { propertyId: property.id, source: "AIRBNB", date: { gte: new Date(`${today}T00:00:00.000Z`) } },
      });
      if (existingFuture > 0) {
        throw new IcalSyncError(
          `Airbnb calendar for ${property.slug} came back with no upcoming reservations, but ${existingFuture} ` +
            `upcoming Airbnb nights are blocked. Kept them; confirm in Admin → Setup if the calendar really is empty.`,
          "EMPTY_FEED",
        );
      }
    }
    await tx.blockedDate.deleteMany({ where: { propertyId: property.id, source: "AIRBNB" } });
    await tx.blockedDate.createMany({
      data: Array.from(nights).map((date) => ({
        propertyId: property.id,
        date: new Date(`${date}T00:00:00.000Z`),
        source: "AIRBNB" as const,
      })),
    });
  }).catch((error) => {
    recordSyncFailure(property.id);
    throw error;
  });

  lastSyncedAt.set(property.id, Date.now());
  lastFailedAt.delete(property.id);
  return { ok: true as const, nights: nights.size };
}

// After a failure, wait before retrying from page loads so a broken feed isn't hit on every request.
const FAILURE_BACKOFF_MS = 2 * 60_000;
const lastFailedAt = new Map<number, number>();
const recordSyncFailure = (propertyId: number) => lastFailedAt.set(propertyId, Date.now());

/** When this instance last imported the property's Airbnb calendar successfully (ms epoch), if ever. */
export const lastSuccessfulSyncAt = (propertyId: number) => lastSyncedAt.get(propertyId) ?? null;

export type StaleSyncResult = "fresh" | "synced" | "failed" | "no-url";

/**
 * Syncs if this instance hasn't synced the property recently. State is per server instance
 * (and per route bundle), so a cold instance always syncs first. Never throws. Returns "failed" when
 * the latest attempt failed (including during the retry backoff), so callers can fail closed.
 */
export async function syncAirbnbCalendarIfStale(
  property: SyncableProperty,
  maxAgeMs = 10 * 60_000,
  { retryImmediately = false }: { retryImmediately?: boolean } = {},
): Promise<StaleSyncResult> {
  if (!isUsableIcalUrl(property.airbnbIcalUrl)) return "no-url";
  const last = lastSyncedAt.get(property.id) ?? 0;
  const failedAt = lastFailedAt.get(property.id) ?? 0;
  if (failedAt > last) {
    // The latest attempt failed: report it until a retry (after the backoff) succeeds.
    // Checkout retries straight away; page loads back off so a broken feed isn't hammered.
    if (!retryImmediately && Date.now() - failedAt < Math.min(maxAgeMs, FAILURE_BACKOFF_MS)) return "failed";
  } else if (Date.now() - last < maxAgeMs) {
    return "fresh";
  }
  try {
    await syncAirbnbCalendar(property);
    return "synced";
  } catch (error) {
    console.error("[ical] Airbnb calendar sync failed", error);
    return "failed";
  }
}

// --- Export feed (Bunks → Airbnb) ---

function feedSecret() {
  const secret = process.env.ICAL_FEED_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("ICAL_FEED_SECRET (or ADMIN_SESSION_SECRET) must be set");
  }
  return secret ?? "bunks-dev-ical";
}

export function calendarFeedToken(slug: string) {
  return crypto.createHmac("sha256", feedSecret()).update(`ical:${slug}`).digest("hex").slice(0, 32);
}

export function isValidCalendarFeedToken(slug: string, token: string | null) {
  if (!token) return false;
  const expected = Buffer.from(calendarFeedToken(slug));
  const given = Buffer.from(token);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

const icsDate = (isoDate: string) => isoDate.replace(/-/g, "");

/** Direct bookings and manual blocks as all-day events. Airbnb-sourced blocks are excluded to avoid echoing. */
export async function buildCalendarFeed(property: { id: number; slug: string; name: string }) {
  const today = new Date();
  const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 30));

  const [bookings, directBlocks, specialBlocks] = await Promise.all([
    prisma.booking.findMany({
      where: { propertyId: property.id, status: "PAID", checkOutDate: { gt: from } },
      select: { id: true, checkInDate: true, checkOutDate: true },
    }),
    prisma.blockedDate.findMany({ where: { propertyId: property.id, source: "DIRECT", date: { gte: from } }, select: { date: true } }),
    prisma.specialRate.findMany({ where: { propertyId: property.id, isBlocked: true, date: { gte: from } }, select: { date: true } }),
  ]);

  const bookedNights = new Set<string>();
  const events: { uid: string; start: string; end: string; summary: string }[] = [];

  for (const booking of bookings) {
    for (const night of eachNight(booking.checkInDate, booking.checkOutDate)) bookedNights.add(toISODate(night));
    events.push({
      uid: `booking-${booking.id}@bunks.com`,
      start: toISODate(booking.checkInDate),
      end: toISODate(booking.checkOutDate),
      summary: "Reserved (Bunks direct)",
    });
  }

  // Group remaining blocked nights into consecutive ranges.
  const blockedNights = Array.from(
    new Set([...directBlocks, ...specialBlocks].map((row) => toISODate(row.date)).filter((d) => !bookedNights.has(d))),
  ).sort();
  let rangeStart: string | null = null;
  let previous: string | null = null;
  const flush = () => {
    if (!rangeStart || !previous) return;
    const end = new Date(`${previous}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    events.push({ uid: `block-${rangeStart}@bunks.com`, start: rangeStart, end: toISODate(end), summary: "Not available" });
  };
  for (const night of blockedNights) {
    const expected: string | null = previous ? toISODate(new Date(Date.parse(`${previous}T00:00:00.000Z`) + 86_400_000)) : null;
    if (night !== expected) {
      flush();
      rangeStart = night;
    }
    previous = night;
  }
  flush();

  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bunks//Availability//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${property.name} (Bunks)`,
    ...events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(event.start)}`,
      `DTEND;VALUE=DATE:${icsDate(event.end)}`,
      `SUMMARY:${event.summary}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
