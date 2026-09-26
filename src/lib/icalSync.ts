import "server-only";

import crypto from "crypto";
import * as ical from "ical";
import { prisma } from "@/lib/prisma";
import { eachNight, toISODate } from "@/lib/bookingAvailability";

type SyncableProperty = { id: number; slug: string; airbnbIcalUrl: string | null };

const PLACEHOLDER_ICAL_HOSTS = ["calendarlabs.com"];
const lastSyncedAt = new Map<number, number>();

const toUtcDay = (value: Date) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

export function isUsableIcalUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const { hostname, protocol } = new URL(url);
    return protocol.startsWith("http") && !PLACEHOLDER_ICAL_HOSTS.some((host) => hostname.endsWith(host));
  } catch {
    return false;
  }
}

/**
 * Imports the Airbnb calendar into BlockedDate(AIRBNB). The replace is atomic, and a failed
 * or malformed fetch leaves the existing blocks untouched.
 */
export async function syncAirbnbCalendar(property: SyncableProperty) {
  if (!isUsableIcalUrl(property.airbnbIcalUrl)) {
    return { ok: false as const, reason: "NO_ICAL_URL" };
  }

  const res = await fetch(property.airbnbIcalUrl, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  const text = res.ok ? await res.text() : "";
  if (!res.ok || !text.includes("BEGIN:VCALENDAR")) {
    throw new Error(`Airbnb iCal fetch failed for ${property.slug} (HTTP ${res.status})`);
  }

  const nights = new Set<string>();
  for (const event of Object.values(ical.parseICS(text))) {
    if (!event || event.type !== "VEVENT" || !event.start || !event.end) continue;
    for (const night of eachNight(toUtcDay(new Date(event.start)), toUtcDay(new Date(event.end)))) {
      nights.add(toISODate(night));
    }
  }

  await prisma.$transaction([
    prisma.blockedDate.deleteMany({ where: { propertyId: property.id, source: "AIRBNB" } }),
    prisma.blockedDate.createMany({
      data: Array.from(nights).map((date) => ({
        propertyId: property.id,
        date: new Date(`${date}T00:00:00.000Z`),
        source: "AIRBNB" as const,
      })),
    }),
  ]);

  lastSyncedAt.set(property.id, Date.now());
  return { ok: true as const, nights: nights.size };
}

/** Syncs if this instance hasn't synced the property recently. Never throws. */
export async function syncAirbnbCalendarIfStale(property: SyncableProperty, maxAgeMs = 10 * 60_000) {
  const last = lastSyncedAt.get(property.id) ?? 0;
  if (Date.now() - last < maxAgeMs) return;
  try {
    await syncAirbnbCalendar(property);
  } catch (error) {
    console.error("[ical] Airbnb calendar sync failed", error);
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
