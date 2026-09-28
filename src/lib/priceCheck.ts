import "server-only";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { parseIcalUrls } from "@/lib/icalSync";
import { getUnavailableNights, parseStayDate, toISODate } from "@/lib/bookingAvailability";
import { checkStayRules, minimumNightsFor, propertyToday, resolvePropertyTimeZone } from "@/lib/stayRules";
import { calculatePricing } from "@/lib/pricing/calculator";
import { sendEmail } from "@/lib/email/sendEmail";
import { OPS_ALERT_EMAIL } from "@/lib/contact";
import { escapeHtml } from "@/lib/html";

// Airbnb price comparison. An external runner (scripts/airbnb-price-runner, GitHub Actions)
// asks Bunks which stays to check, fetches Airbnb's guest-facing quotes for them, and posts
// the quotes back. Bunks compares them with its own price for the same stay and alerts when
// the direct-booking saving falls below the target. Airbnb quotes are never used as prices.
//
// Both sides are compared before tax: Airbnb's US total-price display includes fees but not
// taxes, and Bunks' side is nightly (10% off) + cleaning + 5% service fee. Set
// PRICE_CHECK_COMPARE_WITH_TAX=true if Airbnb's displayed total turns out to include tax.

const ARRIVAL_OFFSETS_DAYS = [14, 30, 60, 90];
const STAY_LENGTHS = [3, 7];
const ADULTS = 2;
const DAY_MS = 86_400_000;
const LAST_RESULTS_KEY = "price-check:last-results";
export const STALE_AFTER_MS = 36 * 60 * 60 * 1000;

export const minSavingsPct = () => {
  const value = Number(process.env.PRICE_CHECK_MIN_SAVINGS_PCT ?? "5");
  return Number.isFinite(value) ? value : 5;
};
const compareWithTax = () => process.env.PRICE_CHECK_COMPARE_WITH_TAX === "true";

export function isAuthorizedPriceCheckRequest(request: Request) {
  const secret = process.env.PRICE_CHECK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/** Airbnb listing IDs from a property's calendar links (airbnb.* hosts; any host outside production, for QA). */
export function airbnbListingIds(icalUrls: string | null | undefined): string[] {
  const anyHost = process.env.NODE_ENV !== "production";
  const ids = parseIcalUrls(icalUrls ?? "").map((url) => {
    try {
      const parsed = new URL(url);
      if (!anyHost && !/(^|\.)airbnb\.[a-z.]+$/.test(parsed.hostname)) return null;
      return parsed.pathname.match(/\/calendar\/ical\/(\d+)\.ics$/)?.[1] ?? null;
    } catch {
      return null;
    }
  });
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

export type Scenario = {
  scenarioId: string;
  listingId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  pets: number;
};

type ScenarioKey = { slug: string; listingId: string; checkIn: string; checkOut: string; adults: number; pets: number };

// The scenario id carries everything needed to re-price it, so nothing is stored between calls.
const encodeScenarioId = (key: ScenarioKey) =>
  [key.slug, key.listingId, key.checkIn, key.checkOut, key.adults, key.pets].join("|");

export function decodeScenarioId(id: unknown): ScenarioKey | null {
  if (typeof id !== "string" || id.length > 200) return null;
  const [slug, listingId, checkIn, checkOut, adults, pets, ...rest] = id.split("|");
  if (rest.length || !/^[a-z0-9-]+$/.test(slug ?? "") || !/^[1-9]\d*$/.test(listingId ?? "")) return null;
  if (!parseStayDate(checkIn) || !parseStayDate(checkOut) || checkOut <= checkIn) return null;
  const a = Number(adults);
  const p = Number(pets);
  if (!Number.isInteger(a) || a < 1 || a > 16 || !Number.isInteger(p) || p < 0 || p > 5) return null;
  return { slug, listingId, checkIn, checkOut, adults: a, pets: p };
}

const propertySelect = {
  id: true,
  slug: true,
  name: true,
  timezone: true,
  maxGuests: true,
  airbnbIcalUrl: true,
} as const;

/** The stays to price on Airbnb: 3- and 7-night stays at four upcoming arrival dates. */
export async function buildScenarios(now = new Date()): Promise<Scenario[]> {
  const properties = await prisma.property.findMany({ select: propertySelect });
  const scenarios: Scenario[] = [];
  for (const property of properties) {
    const listingIds = airbnbListingIds(property.airbnbIcalUrl);
    if (!listingIds.length) continue;
    const today = propertyToday(resolvePropertyTimeZone(property), now);
    const lengths = [...new Set(STAY_LENGTHS.map((n) => Math.max(n, minimumNightsFor(property.slug))))];
    for (const offset of ARRIVAL_OFFSETS_DAYS) {
      for (const nights of lengths) {
        const checkIn = new Date(today.getTime() + offset * DAY_MS);
        const checkOut = new Date(checkIn.getTime() + nights * DAY_MS);
        if (checkStayRules(property, checkIn, checkOut, now)) continue;
        // Already booked or blocked on Bunks: nothing to compare.
        const unavailable = await getUnavailableNights(property.id, checkIn, checkOut, { includePendingHolds: false });
        if (unavailable.size) continue;
        for (const listingId of listingIds) {
          const key = {
            slug: property.slug,
            listingId,
            checkIn: toISODate(checkIn),
            checkOut: toISODate(checkOut),
            adults: Math.min(ADULTS, property.maxGuests ?? ADULTS),
            pets: 0,
          };
          scenarios.push({ scenarioId: encodeScenarioId(key), ...key });
        }
      }
    }
  }
  return scenarios;
}

export type IncomingQuote = {
  scenarioId: string;
  status: "ok" | "unavailable" | "error" | "blocked";
  totalCents?: number | null;
  currency?: string | null;
  feesIncluded?: boolean | null;
  priceLabel?: string | null;
  cancellation?: string | null;
  unavailableReason?: string | null;
  error?: string | null;
};

export type Comparison = {
  scenarioId: string;
  property: string;
  listingId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  status: "compared" | "below-target" | "airbnb-unavailable" | "bunks-unavailable" | "airbnb-failed" | "invalid";
  airbnbCents?: number;
  bunksCents?: number;
  savingsPct?: number;
  cancellation?: string | null;
  note?: string;
};

const STATUSES = new Set(["ok", "unavailable", "error", "blocked"]);

export function validateQuote(raw: unknown): IncomingQuote | null {
  const q = raw as IncomingQuote;
  if (!q || typeof q.scenarioId !== "string" || !STATUSES.has(q.status)) return null;
  if (q.status === "ok") {
    if (!Number.isSafeInteger(q.totalCents) || (q.totalCents as number) <= 0 || (q.totalCents as number) > 10_000_000) return null;
    if (q.currency !== "USD") return null;
  }
  return q;
}

const text = (value: unknown, max = 300) => (typeof value === "string" ? value.slice(0, max) : null);

/** Compares each Airbnb quote with Bunks' current price for the same stay. */
export async function compareQuotes(quotes: IncomingQuote[]): Promise<Comparison[]> {
  const properties = await prisma.property.findMany({ select: propertySelect });
  const bySlug = new Map(properties.map((p) => [p.slug, p]));
  const target = minSavingsPct();
  const results: Comparison[] = [];

  for (const quote of quotes) {
    const key = decodeScenarioId(quote.scenarioId);
    const property = key ? bySlug.get(key.slug) : undefined;
    if (!key || !property || !airbnbListingIds(property.airbnbIcalUrl).includes(key.listingId)) {
      results.push({ scenarioId: String(quote.scenarioId).slice(0, 200), property: "?", listingId: "?", checkIn: "?", checkOut: "?", nights: 0, status: "invalid", note: "Unknown scenario or listing." });
      continue;
    }
    const checkIn = parseStayDate(key.checkIn)!;
    const checkOut = parseStayDate(key.checkOut)!;
    const base = {
      scenarioId: quote.scenarioId,
      property: property.name,
      listingId: key.listingId,
      checkIn: key.checkIn,
      checkOut: key.checkOut,
      nights: Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS),
      cancellation: text(quote.cancellation),
    };

    if (quote.status === "error" || quote.status === "blocked") {
      results.push({ ...base, status: "airbnb-failed", note: text(quote.error) ?? quote.status });
      continue;
    }

    const unavailable = await getUnavailableNights(property.id, checkIn, checkOut, { includePendingHolds: false });
    if (unavailable.size) {
      results.push({ ...base, status: "bunks-unavailable", note: "Booked or blocked on Bunks since the scenarios were issued." });
      continue;
    }
    if (quote.status === "unavailable") {
      results.push({ ...base, status: "airbnb-unavailable", note: text(quote.unavailableReason) ?? "Airbnb shows these dates as unavailable." });
      continue;
    }

    const bunks = await calculatePricing(property.slug, checkIn, checkOut, key.adults);
    const bunksCents = compareWithTax() ? bunks.totalPriceCents : bunks.totalPriceCents - bunks.taxCents;
    const airbnbCents = quote.totalCents as number;
    const savingsPct = Math.round(((airbnbCents - bunksCents) / airbnbCents) * 1000) / 10;
    results.push({
      ...base,
      status: savingsPct < target ? "below-target" : "compared",
      airbnbCents,
      bunksCents,
      savingsPct,
      note: quote.feesIncluded === false ? "Airbnb didn't say its price includes all fees." : undefined,
    });
  }
  return results;
}

export async function recordResultsReceived() {
  await prisma.featureToggle.upsert({
    where: { key: LAST_RESULTS_KEY },
    create: { key: LAST_RESULTS_KEY, enabled: true },
    update: { enabled: true, updatedAt: new Date() },
  });
}

/** When results last arrived; null if the runner has never reported. */
export async function lastResultsAt() {
  const row = await prisma.featureToggle.findUnique({ where: { key: LAST_RESULTS_KEY } });
  return row?.updatedAt ?? null;
}

const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

const STATUS_LABEL: Record<Comparison["status"], string> = {
  compared: "OK",
  "below-target": "Below target",
  "airbnb-unavailable": "Not available on Airbnb",
  "bunks-unavailable": "Booked on Bunks",
  "airbnb-failed": "Airbnb quote failed",
  invalid: "Invalid",
};

// During the pilot every run emails the full table so the prices can be checked by eye.
// PRICE_CHECK_DIGEST=false limits emails to runs with a problem.
const digestEnabled = () => process.env.PRICE_CHECK_DIGEST !== "false";

/**
 * Emails ops the run's results: always while the digest is on, otherwise only when a stay is
 * below the savings target or Airbnb quotes failed.
 */
export async function alertOnComparisons(comparisons: Comparison[]) {
  const below = comparisons.filter((c) => c.status === "below-target");
  const failed = comparisons.filter((c) => c.status === "airbnb-failed" || c.status === "invalid");
  const compared = comparisons.filter((c) => c.status === "compared" || c.status === "below-target");
  if (!below.length && !failed.length && !digestEnabled()) return false;

  const target = minSavingsPct();
  const basis = compareWithTax() ? "including tax" : "before tax";
  const rows = [...comparisons]
    .sort((a, b) => a.property.localeCompare(b.property) || a.checkIn.localeCompare(b.checkIn) || a.nights - b.nights)
    .map((c) => {
      const flagged = c.status === "below-target" || c.status === "airbnb-failed" || c.status === "invalid";
      return (
        `<tr${flagged ? ' style="background:#fdecea"' : ""}><td>${escapeHtml(c.property)}</td>` +
        `<td>${c.checkIn} → ${c.checkOut} (${c.nights}n)</td>` +
        `<td>${c.bunksCents !== undefined ? usd(c.bunksCents) : "—"}</td>` +
        `<td>${c.airbnbCents !== undefined ? usd(c.airbnbCents) : "—"}</td>` +
        `<td>${c.savingsPct !== undefined ? `${c.savingsPct}%` : "—"}</td>` +
        `<td>${escapeHtml(STATUS_LABEL[c.status])}${c.note ? `: ${escapeHtml(c.note)}` : ""}</td>` +
        `<td>${escapeHtml(c.cancellation ?? "")}</td></tr>`
      );
    })
    .join("");
  const subject = below.length
    ? `Price check: Bunks saves less than ${target}% on ${below.length} stay${below.length === 1 ? "" : "s"}`
    : failed.length
      ? `Price check: ${failed.length} Airbnb quote${failed.length === 1 ? "" : "s"} failed`
      : `Price check: all ${compared.length} compared stays save at least ${target}%`;

  await sendEmail({
    to: OPS_ALERT_EMAIL,
    subject,
    html:
      `<p>Bunks vs Airbnb for the same dates, 2 adults, compared ${basis}. Target saving: ${target}%. ` +
      `Rows in red need attention.</p>` +
      `<table cellpadding="6" border="1" style="border-collapse:collapse"><tr><th>Home</th><th>Stay</th><th>Bunks</th>` +
      `<th>Airbnb</th><th>Saving</th><th>Result</th><th>Airbnb cancellation</th></tr>${rows}</table>` +
      `<p>Bunks' prices come from Admin → Pricing (10% off your nightly rate, plus cleaning and the 5% service fee). ` +
      `Bunks' cancellation policy: full refund 30+ days before check-in.</p>` +
      (failed.length
        ? `<p>If quotes keep failing, Airbnb may have changed its page or blocked the checker. See scripts/airbnb-price-runner/README.md.</p>`
        : ""),
  }).catch((error) => console.error("[price-check] failed to send alert", error));
  return true;
}

/** Emails ops if the runner has reported before but not in the last 36 hours. */
export async function alertIfPriceCheckStale(now = new Date()) {
  const last = await lastResultsAt();
  if (!last || now.getTime() - last.getTime() < STALE_AFTER_MS) return false;
  await sendEmail({
    to: OPS_ALERT_EMAIL,
    subject: "Price check: no Airbnb results in over 36 hours",
    html:
      `<p>The Airbnb price checker last reported ${escapeHtml(last.toUTCString())}.</p>` +
      `<p>Check the "Airbnb price check" workflow in GitHub → Actions. Until it runs again, Bunks prices aren't being compared with Airbnb.</p>`,
  }).catch((error) => console.error("[price-check] failed to send stale alert", error));
  return true;
}
