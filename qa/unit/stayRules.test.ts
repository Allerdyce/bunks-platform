import { test } from "node:test";
import assert from "node:assert/strict";
import { checkStayRules, propertyToday, MAX_NIGHTS } from "@/lib/stayRules";
import { parseStayDate } from "@/lib/bookingAvailability";

const sb = { slug: "steamboat-downtown-townhome", timezone: "America/Denver" };
const d = (s: string) => parseStayDate(s)!;
// 2026-09-27 05:00 UTC = Sep 26, 11pm in Denver
const now = new Date("2026-09-27T05:00:00Z");

test("property-local today", () => {
  assert.equal(propertyToday("America/Denver", now).toISOString().slice(0, 10), "2026-09-26");
  assert.equal(propertyToday("America/Los_Angeles", now).toISOString().slice(0, 10), "2026-09-26");
  assert.equal(propertyToday("bogus/zone", now).toISOString().slice(0, 10), "2026-09-26");
});

test("check-in today (local) is allowed; yesterday is not", () => {
  assert.equal(checkStayRules(sb, d("2026-09-26"), d("2026-09-29"), now), null);
  assert.equal(checkStayRules(sb, d("2026-09-25"), d("2026-09-28"), now)?.error, "PAST_DATE");
});

test("minimum and maximum stay", () => {
  assert.equal(checkStayRules(sb, d("2026-10-05"), d("2026-10-07"), now)?.error, "MINIMUM_STAY");
  assert.equal(checkStayRules(sb, d("2026-10-05"), d("2026-10-08"), now), null);
  const end = new Date(d("2026-10-05").getTime() + (MAX_NIGHTS + 1) * 86_400_000);
  assert.equal(checkStayRules(sb, d("2026-10-05"), end, now)?.error, "MAXIMUM_STAY");
});

test("DST: Oct 31 → Nov 3 is 3 nights", () => {
  assert.equal(checkStayRules(sb, d("2026-10-31"), d("2026-11-03"), now), null);
});

test("too far ahead", () => {
  assert.equal(checkStayRules(sb, d("2029-01-01"), d("2029-01-05"), now)?.error, "TOO_FAR_AHEAD");
});

test("strict date parsing", () => {
  assert.equal(parseStayDate("2027-02-30"), null);
  assert.equal(parseStayDate("2026-13-01"), null);
  assert.equal(parseStayDate("9999-01-01"), null);
  assert.equal(parseStayDate("2028-02-29")?.toISOString(), "2028-02-29T00:00:00.000Z");
  assert.equal(parseStayDate(20261005), null);
});

import { hitRateLimit } from "@/lib/rateLimit";

test("rate limiter blocks after the limit and resets after the window", () => {
  const t0 = 1_000_000;
  for (let i = 0; i < 3; i += 1) assert.equal(hitRateLimit("unit:a", 3, 60_000, t0 + i), 0);
  assert.ok(hitRateLimit("unit:a", 3, 60_000, t0 + 10) > 0);
  assert.equal(hitRateLimit("unit:b", 3, 60_000, t0 + 10), 0, "other keys unaffected");
  assert.equal(hitRateLimit("unit:a", 3, 60_000, t0 + 60_001), 0, "window resets");
});
