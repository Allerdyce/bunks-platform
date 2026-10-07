// Scenario dates, computed from today so stays never fall into the past (the booking API rejects
// past check-ins), plus the iCal fixtures filled in with them.
// - d(n): n days from today at the property (America/Denver unless given). For checks about
//   "today", "tomorrow" or the past.
// - mon(n): n days after the scenario Monday, the first Monday at least six weeks ahead. Everything
//   else uses these, so timezone edges don't matter and weekdays line up with the pricing rules:
//   mon(0)→mon(4) is Mon→Fri (four weekday nights), mon(11)→mon(14) is Fri→Mon (a weekend).
//   The latest stay ends at mon(60), well inside the 2-year booking horizon.
// Run directly (`node qa/e2e/dates.mjs <dir>`) it writes the filled-in iCal fixtures to <dir>.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DAY_MS = 86_400_000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const localToday = (timeZone) => Date.parse(`${new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date())}T00:00:00Z`);

export const d = (n = 0, timeZone = "America/Denver") => iso(localToday(timeZone) + n * DAY_MS);

// Fixed once per run, so a run that crosses midnight keeps its weekdays.
const MONDAY = (() => {
  const t = localToday("America/Denver") + 42 * DAY_MS;
  return t + ((8 - new Date(t).getUTCDay()) % 7) * DAY_MS;
})();
export const mon = (n) => iso(MONDAY + n * DAY_MS);

/** YYYY-MM-DD → YYYYMMDD, as in iCal DATE values. */
export const icalDate = (date) => date.replaceAll("-", "");

/** Regex source for a date as emails write it: "Oct 5" or "October 5". */
export function monthDay(date) {
  const at = new Date(`${date}T00:00:00Z`);
  const short = at.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const long = at.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return `${short}(${long.slice(short.length)})?\\s+${at.getUTCDate()}`;
}

const FIXTURES = fileURLToPath(new URL("../fixtures/ical/", import.meta.url));

/** A fixture calendar with its {{mon+N}} placeholders replaced by mon(N). */
export function icalFixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name), "utf8").replace(/\{\{mon([+-]\d+)\}\}/g, (_, n) => icalDate(mon(Number(n))));
}

/** Writes every fixture calendar into `dir`, the folder the fake Airbnb server serves. */
export function writeIcalFixtures(dir) {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(FIXTURES)) fs.writeFileSync(path.join(dir, f), icalFixture(f));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error("usage: node qa/e2e/dates.mjs <ical dir>");
  writeIcalFixtures(process.argv[2]);
}
