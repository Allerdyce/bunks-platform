// Compares what a deployed Bunks site shows as unavailable with what the Airbnb/Vrbo iCal links say.
// Usage (links are passed in, never committed):
//   ICAL_LINKS="https://…ics?t=…\nhttps://…ics?t=…" \
//   TSX_TSCONFIG_PATH=qa/unit/tsconfig.json DATABASE_URL=postgresql://unused@localhost/x \
//   npx tsx qa/tools/calendar-diff.mts https://bunks.com summerland-ocean-view-beach-bungalow
// Namespace imports: the app modules are CommonJS when loaded through tsx.
import * as icalModule from "@/lib/icalSync";
import * as availabilityModule from "@/lib/bookingAvailability";

type IcalApi = typeof import("@/lib/icalSync");
type AvailabilityApi = typeof import("@/lib/bookingAvailability");
const unwrap = <T,>(mod: T & { default?: T }): T => (mod.default ?? mod) as T;
const { parseIcalFeed, describeIcalUrl, parseIcalUrls } = unwrap<IcalApi>(icalModule as IcalApi & { default?: IcalApi });
const { eachNight, toISODate } = unwrap<AvailabilityApi>(availabilityModule as AvailabilityApi & { default?: AvailabilityApi });

const [site, slug] = process.argv.slice(2);
if (!site || !slug) throw new Error("usage: calendar-diff.mts <site-url> <property-slug>");
const links = parseIcalUrls(process.env.ICAL_LINKS);
const today = new Date().toISOString().slice(0, 10);

const ranges = (nights: string[]) => {
  const out: string[] = [];
  let start: string | null = null;
  let prev: string | null = null;
  const next = (d: string) => toISODate(new Date(Date.parse(`${d}T00:00:00Z`) + 86_400_000));
  for (const night of [...nights].sort()) {
    if (start && prev && next(prev) === night) { prev = night; continue; }
    if (start && prev) out.push(`${start} → ${next(prev)}`);
    start = prev = night;
  }
  if (start && prev) out.push(`${start} → ${next(prev)}`);
  return out;
};

const res = await fetch(`${site.replace(/\/$/, "")}/api/properties/${slug}/blocked-dates`, { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0 (compatible; BunksCalendarDiff/1.0)" } });
if (!res.ok) throw new Error(`site returned HTTP ${res.status}`);
const siteNights = new Set<string>(((await res.json()).blockedDates ?? []).map((e: { date: string }) => e.date.slice(0, 10)));

const calendarNights = new Set<string>();
for (const url of links) {
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; BunksCalendarSync/1.0)" } });
  const text = await r.text();
  if (!r.ok || !text.includes("BEGIN:VCALENDAR")) { console.log(`✗ ${describeIcalUrl(url)}: HTTP ${r.status}`); continue; }
  const feed = parseIcalFeed(text);
  const upcoming = feed.ranges.filter((x) => x.end > today);
  console.log(`\n${describeIcalUrl(url)}: ${upcoming.length} upcoming`);
  for (const x of upcoming) console.log(`  ${x.start} → ${x.end}  ${x.kind}`);
  for (const x of upcoming) for (const n of eachNight(new Date(`${x.start}T00:00:00Z`), new Date(`${x.end}T00:00:00Z`))) {
    const iso = toISODate(n);
    if (iso >= today) calendarNights.add(iso);
  }
}

const missing = [...calendarNights].filter((n) => !siteNights.has(n));
const extra = [...siteNights].filter((n) => n >= today && !calendarNights.has(n));
console.log(`\nSite ${site} (${slug}): ${siteNights.size} unavailable nights`);
console.log(`\n✗ Booked/blocked on the calendars but OPEN on the site (${missing.length} nights):`);
ranges(missing).forEach((r) => console.log(`  ${r}`));
console.log(`\n• Unavailable on the site only (${extra.length} nights: direct bookings, owner blocks or stale imports):`);
ranges(extra).forEach((r) => console.log(`  ${r}`));
