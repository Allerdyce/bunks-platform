import "server-only";

import crypto from "crypto";
import * as ical from "ical";
import { prisma } from "@/lib/prisma";
import { eachNight, toISODate, withPropertyLock } from "@/lib/bookingAvailability";
import { claimEmail, completeClaim, releaseClaim } from "@/lib/email/claims";
import { sendEmail } from "@/lib/email/sendEmail";
import { OPS_ALERT_EMAIL } from "@/lib/contact";
import { escapeHtml } from "@/lib/html";

type SyncableProperty = { id: number; slug: string; airbnbIcalUrl: string | null };

const PLACEHOLDER_ICAL_HOSTS = ["calendarlabs.com"];
// Keyed by property + feed URL, so changing the Airbnb link in Setup forces a fresh import.
const lastSyncedAt = new Map<string, number>();
const syncKey = (property: SyncableProperty) => `${property.id}:${property.airbnbIcalUrl ?? ''}`;

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
  return parseIcalFeed(text).nights;
}

/**
 * Like parseIcalNights, and also returns the nights covered by actual guest reservations
 * (Airbnb's SUMMARY "Reserved"), as opposed to "Not available" blocks.
 */
export function parseIcalFeed(text: string) {
  // Normalise line endings: the parser mis-reads feeds that mix CRLF and LF.
  const trimmed = text.replace(/\r\n?/g, "\n").trim();
  if (!trimmed.startsWith("BEGIN:VCALENDAR") || !/END:VCALENDAR$/.test(trimmed)) {
    throw new IcalSyncError("Calendar feed is incomplete (missing BEGIN/END:VCALENDAR)", "MALFORMED_FEED");
  }
  const declaredEvents = (trimmed.match(/^BEGIN:VEVENT\s*$/gm) ?? []).length;
  const closedEvents = (trimmed.match(/^END:VEVENT\s*$/gm) ?? []).length;
  // Parse each VEVENT on its own: the parser merges events that share a UID, which would
  // silently drop a reservation.
  const blocks = trimmed.match(/^BEGIN:VEVENT\s*$[\s\S]*?^END:VEVENT\s*$/gm) ?? [];
  const events = blocks.flatMap((block) =>
    Object.values(ical.parseICS(`BEGIN:VCALENDAR\n${block}\nEND:VCALENDAR`)).filter((event) => event?.type === "VEVENT"),
  );
  if (declaredEvents !== closedEvents || blocks.length !== declaredEvents || events.length !== declaredEvents) {
    throw new IcalSyncError(
      `Calendar feed has ${declaredEvents} events but ${events.length} parsed; refusing to import`,
      "MALFORMED_FEED",
    );
  }

  const nights = new Set<string>();
  const reservedNights = new Set<string>();
  for (const event of events) {
    if (!event.start || Number.isNaN(new Date(event.start).getTime())) {
      throw new IcalSyncError(`Calendar event ${event.uid ?? ""} has no valid start date`, "MALFORMED_FEED");
    }
    const start = toStayDay(event.start as IcalDate);
    // A missing DTEND on an all-day event means a single day.
    const end = event.end ? toStayDay(event.end as IcalDate) : new Date(start.getTime() + DAY_MS);
    const isReservation = /reserved/i.test(String(event.summary ?? ""));
    for (const night of eachNight(start, end > start ? end : new Date(start.getTime() + DAY_MS))) {
      nights.add(toISODate(night));
      if (isReservation) reservedNights.add(toISODate(night));
    }
  }
  return { nights, reservedNights };
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
    const res = await fetch(property.airbnbIcalUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      // Some calendar hosts refuse requests that don't look like a calendar client.
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BunksCalendarSync/1.0; +https://bunks.com)",
        Accept: "text/calendar, text/plain;q=0.9, */*;q=0.8",
      },
    });
    text = res.ok ? await res.text() : "";
    if (!res.ok) {
      const hint =
        res.status === 404 || res.status === 410
          ? "the link wasn't found. It may have been reset in Airbnb; copy a fresh export link."
          : res.status === 401 || res.status === 403
            ? "Airbnb refused the request. Check the link is the full export link including ?t=…"
            : res.status === 429
              ? "Airbnb is rate-limiting requests. It will retry automatically."
              : "Airbnb returned an error.";
      throw new IcalSyncError(`Airbnb calendar for ${property.slug}: HTTP ${res.status}, ${hint}`, "FETCH_FAILED");
    }
    if (!text.includes("BEGIN:VCALENDAR")) {
      throw new IcalSyncError(
        `Airbnb calendar for ${property.slug}: the link returned a web page, not a calendar. Use the export link from Airbnb → Calendar → Availability → Connect calendars.`,
        "FETCH_FAILED",
      );
    }
  } catch (error) {
    recordSyncFailure(property, error);
    if (error instanceof IcalSyncError) throw error;
    throw new IcalSyncError(`Airbnb iCal fetch failed for ${property.slug}: ${(error as Error).message}`, "FETCH_FAILED");
  }

  let nights: Set<string>;
  let reservedNights: Set<string>;
  try {
    ({ nights, reservedNights } = parseIcalFeed(text));
  } catch (error) {
    recordSyncFailure(property, error);
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
    recordSyncFailure(property, error);
    throw error;
  });

  lastSyncedAt.set(syncKey(property), Date.now());
  lastFailure.delete(syncKey(property));
  await alertOnAirbnbOverlap(property, reservedNights).catch((error) =>
    console.error("[ical] Failed to check for Airbnb/direct overlaps", error),
  );
  return { ok: true as const, nights: nights.size };
}

/**
 * Airbnb reads the Bunks calendar every few hours, so an Airbnb guest can still book nights a
 * direct guest has just paid for. Nothing here can undo that, but it can be caught on the next
 * import: email ops once per affected booking so someone can call the guests the same day.
 */
async function alertOnAirbnbOverlap(property: SyncableProperty, reservedNights: Set<string>) {
  if (!reservedNights.size) return;
  const today = new Date(`${toISODate(toUtcDay(new Date()))}T00:00:00.000Z`);
  const bookings = await prisma.booking.findMany({
    where: { propertyId: property.id, status: "PAID", checkOutDate: { gt: today } },
    select: { id: true, publicReference: true, guestName: true, guestEmail: true, checkInDate: true, checkOutDate: true },
  });
  for (const booking of bookings) {
    const clash = eachNight(booking.checkInDate, booking.checkOutDate)
      .map(toISODate)
      .filter((night) => reservedNights.has(night));
    if (!clash.length) continue;
    const target = { type: "SYSTEM_CALENDAR_SYNC_ERROR" as const, to: OPS_ALERT_EMAIL, bookingId: booking.id };
    const claimId = await claimEmail(target);
    if (claimId === null) continue; // already alerted for this booking
    try {
      await sendEmail({
        to: OPS_ALERT_EMAIL,
        subject: `Urgent: possible double booking at ${property.slug} (${booking.publicReference ?? booking.id})`,
        html:
          `<p>The Airbnb calendar now shows a reservation on nights already paid for directly on Bunks:</p>` +
          `<p><strong>${escapeHtml(booking.guestName)}</strong> (${escapeHtml(booking.guestEmail)}), ` +
          `booking ${escapeHtml(booking.publicReference ?? String(booking.id))}: ` +
          `${toISODate(booking.checkInDate)} → ${toISODate(booking.checkOutDate)}.</p>` +
          `<p>Overlapping nights: ${clash.join(", ")}.</p>` +
          `<p>Check both reservations now and contact whichever guest needs to move.</p>`,
      });
      await completeClaim(claimId, target);
    } catch (error) {
      await releaseClaim(claimId);
      throw error;
    }
  }
}

// After a failure, wait before retrying from page loads so a broken feed isn't hit on every request.
const FAILURE_BACKOFF_MS = 2 * 60_000;
type SyncFailure = { at: number; reason: IcalSyncError["reason"] };
const lastFailure = new Map<string, SyncFailure>();
const recordSyncFailure = (property: SyncableProperty, error?: unknown) =>
  lastFailure.set(syncKey(property), {
    at: Date.now(),
    reason: error instanceof IcalSyncError ? error.reason : "FETCH_FAILED",
  });

// Email ops when an import fails, at most every few hours per property and server instance.
const ALERT_INTERVAL_MS = 4 * 60 * 60_000;
const lastAlertAt = new Map<string, number>();
async function alertSyncFailure(property: SyncableProperty, error: unknown) {
  const key = syncKey(property);
  if (Date.now() - (lastAlertAt.get(key) ?? 0) < ALERT_INTERVAL_MS) return;
  lastAlertAt.set(key, Date.now());
  const reason = error instanceof IcalSyncError ? error.reason : "FETCH_FAILED";
  const consequence =
    reason === "EMPTY_FEED"
      ? "Bookings continue; the existing Airbnb blocks are kept until you confirm in Admin → Setup."
      : "Direct checkout for this home is paused until the import works again.";
  await sendEmail({
    to: OPS_ALERT_EMAIL,
    subject: `Action needed: Airbnb calendar import failed for ${property.slug}`,
    html:
      `<p>${escapeHtml((error as Error)?.message ?? String(error))}</p><p>${consequence}</p>` +
      `<p>Check the Airbnb calendar link in Admin → Setup and press "Sync now".</p>`,
  }).catch((sendError) => console.error("[ical] Failed to send sync alert", sendError));
}


export type StaleSyncResult = "fresh" | "synced" | "kept-existing" | "failed" | "no-url";

/**
 * Syncs if this instance hasn't synced the property recently. State is per server instance
 * (and per route bundle), so a cold instance always syncs first. Never throws.
 * - "failed": the feed couldn't be read or parsed, so recent Airbnb reservations may be missing
 *   (callers taking payment should stop).
 * - "kept-existing": the feed came back empty while upcoming Airbnb nights are blocked; the old
 *   blocks were kept, which can only over-block, so it's safe to continue.
 */
export async function syncAirbnbCalendarIfStale(
  property: SyncableProperty,
  maxAgeMs = 10 * 60_000,
  { retryImmediately = false }: { retryImmediately?: boolean } = {},
): Promise<StaleSyncResult> {
  if (!isUsableIcalUrl(property.airbnbIcalUrl)) return "no-url";
  const last = lastSyncedAt.get(syncKey(property)) ?? 0;
  const failure = lastFailure.get(syncKey(property));
  const outcomeOf = (reason: SyncFailure["reason"]) => (reason === "EMPTY_FEED" ? "kept-existing" : "failed");
  if (failure && failure.at > last) {
    // The latest attempt failed: report it until a retry (after the backoff) succeeds.
    // Checkout retries straight away; page loads back off so a broken feed isn't hammered.
    if (!retryImmediately && Date.now() - failure.at < Math.min(maxAgeMs, FAILURE_BACKOFF_MS)) {
      return outcomeOf(failure.reason);
    }
  } else if (Date.now() - last < maxAgeMs) {
    return "fresh";
  }
  try {
    await syncAirbnbCalendar(property);
    return "synced";
  } catch (error) {
    console.error("[ical] Airbnb calendar sync failed", error);
    await alertSyncFailure(property, error);
    return outcomeOf(error instanceof IcalSyncError ? error.reason : "FETCH_FAILED");
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
