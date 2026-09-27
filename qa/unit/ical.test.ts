// Run: qa/unit/run.sh (runs under several server timezones)
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseIcalNights } from "@/lib/icalSync";

const feed = (events: string) =>
  `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Airbnb Inc//Hosting Calendar 1.0//EN\r\n${events}END:VCALENDAR\r\n`;
const event = (uid: string, start: string, end?: string) =>
  `BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:${start}\r\n${end ? `DTEND;VALUE=DATE:${end}\r\n` : ""}UID:${uid}\r\nSUMMARY:Reserved\r\nEND:VEVENT\r\n`;

test(`all-day reservation blocks exactly its nights (TZ=${process.env.TZ})`, () => {
  const nights = [...parseIcalNights(feed(event("a", "20261005", "20261008")))].sort();
  assert.deepEqual(nights, ["2026-10-05", "2026-10-06", "2026-10-07"]);
});

test("DST boundaries don't shift nights", () => {
  const nights = [...parseIcalNights(feed(event("a", "20261030", "20261103") + event("b", "20270312", "20270316")))].sort();
  assert.deepEqual(nights, ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2027-03-12", "2027-03-13", "2027-03-14", "2027-03-15"]);
});

test("missing DTEND means one night", () => {
  assert.deepEqual([...parseIcalNights(feed(event("a", "20261005")))], ["2026-10-05"]);
});

test("truncated feed is rejected", () => {
  const full = feed(event("a", "20261005", "20261008"));
  assert.throws(() => parseIcalNights(full.slice(0, full.indexOf("DTEND"))), /incomplete/);
});

test("event cut off inside the calendar is rejected", () => {
  const broken = feed(event("a", "20261005", "20261008") + "BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261101\r\n");
  assert.throws(() => parseIcalNights(broken));
});

test("duplicate UIDs (merged by the parser) are rejected instead of silently dropped", () => {
  assert.throws(() => parseIcalNights(feed(event("same", "20261005", "20261008") + event("same", "20261101", "20261105"))));
});

test("empty calendar parses to no nights", () => {
  assert.equal(parseIcalNights(feed("")).size, 0);
});

test("HTML error page is rejected", () => {
  assert.throws(() => parseIcalNights("<html>Please log in</html>"));
});
