// End-to-end booking scenarios against the local QA stack (see qa/harness/README.md).
// Usage: EMAIL_CAPTURE_DIR=... QA_ICAL_DIR=... node qa/e2e/run-all.mjs [filter]
import fs from "node:fs";
import {
  api, stripe, db, resetData, clearEmails, emails, writeIcal, removeIcal, restoreIcal, adminCookie, forceSync,
  book, pay, expireHold, scenario, check, results, SB, SL, CRON_SECRET, ICAL_DIR,
} from "./lib.mjs";

const filter = process.argv[2];
const scenarios = [];
const def = (name, fn) => scenarios.push({ name, fn });

// Steamboat: $350 weekday / $420 weekend, $180 cleaning, 10% lodging tax on nightly+cleaning (QA fixture).
// Oct 5–9 2026 = Mon–Thu nights: 4 × 31500 = 126000; fee 6300; cleaning 18000; tax 14400 → 164700.
const EXPECTED_TOTAL = 164700;

def("Quote matches pricing rules", async () => {
  const r = await api(`/api/properties/${SB}/check-availability`, { method: "POST", body: { checkIn: "2026-10-05", checkOut: "2026-10-09", guests: 2 } });
  check("Q1", "quote available for open dates", r.json?.available === true, r.text);
  const q = r.json?.quote ?? {};
  check("Q2", "nightly subtotal is 10% below owner rate", q.nightlySubtotalCents === 126000 && q.undiscountedNightlySubtotalCents === 140000, JSON.stringify(q));
  check("Q3", "service fee is 5% of discounted nightly", q.serviceFeeCents === 6300, q.serviceFeeCents);
  check("Q4", "tax applied to nightly + cleaning", q.taxCents === 14400, q.taxCents);
  check("Q5", "total = nightly + cleaning + fee + tax", q.totalPriceCents === EXPECTED_TOTAL, q.totalPriceCents);
  const wk = await api(`/api/properties/${SB}/check-availability`, { method: "POST", body: { checkIn: "2026-10-16", checkOut: "2026-10-19" } });
  // Fri + Sat at 42000 → 37800 each, Sun at 35000 → 31500
  check("Q6", "Fri/Sat nights use weekend rate", wk.json?.quote?.nightlySubtotalCents === 37800 * 2 + 31500, JSON.stringify(wk.json?.quote?.nightlyLineItems));
  const short = await api(`/api/properties/${SB}/check-availability`, { method: "POST", body: { checkIn: "2026-10-05", checkOut: "2026-10-06" } });
  check("Q7", "quote rejects stays under the 3-night minimum", short.json?.available === false && short.json?.reason === "MINIMUM_STAY", short.text, "T-AV-07");
});

def("Happy path: book, pay, confirm", async () => {
  const r = await book();
  check("H1", "booking created (200) with clientSecret + 5-char reference", r.status === 200 && r.json?.clientSecret && /^[A-Z0-9]{5}$/.test(r.json?.bookingReference ?? ""), r.text);
  check("H2", "server total matches quote", r.json?.totalPriceCents === EXPECTED_TOTAL, r.json?.totalPriceCents);
  const b = await db.booking.findUnique({ where: { id: r.json.bookingId } });
  check("H3", "booking is PENDING with a real PaymentIntent id", b?.status === "PENDING" && b?.stripePaymentIntentId.startsWith("pi_"), JSON.stringify(b));
  const state = await stripe("/__test/state");
  const pi = state.pis.find((p) => p.id === b.stripePaymentIntentId);
  check("H4", "PaymentIntent amount equals booking total", pi?.amount === EXPECTED_TOTAL, pi?.amount);
  check("H4b", "PaymentIntent accepts cards only (incl. Apple/Google Pay)", JSON.stringify(pi?.payment_method_types) === JSON.stringify({ 0: "card" }) || JSON.stringify(pi?.payment_method_types) === '["card"]', JSON.stringify(pi?.payment_method_types), "Q3");
  const { webhook } = await pay(r);
  check("H5", "webhook accepted", webhook.status === 200, JSON.stringify(webhook));
  const paid = await db.booking.findUnique({ where: { id: b.id } });
  check("H6", "booking becomes PAID", paid.status === "PAID", paid.status);
  const blocks = await db.blockedDate.findMany({ where: { propertyId: b.propertyId, source: "DIRECT" } });
  check("H7", "exactly the 4 stay nights are blocked (not checkout day)", blocks.length === 4 && !blocks.some((x) => x.date.toISOString().startsWith("2026-10-09")), blocks.map((x) => x.date.toISOString().slice(0, 10)).join(","));
  const cal = await api(`/api/properties/${SB}/blocked-dates`);
  const blocked = JSON.stringify(cal.json ?? {});
  check("H8", "public calendar shows the booked nights", blocked.includes("2026-10-05") && blocked.includes("2026-10-08"), blocked.slice(0, 300));
  const mails = emails();
  const toGuest = mails.filter((m) => m.to === "guest1@example.com");
  check("H9", "guest receives receipt/confirmation emails", toGuest.length >= 1, mails.map((m) => `${m.to}: ${m.subject}`).join(" | "));
  check("H10", "host/ops receives a new-booking notification", mails.some((m) => m.to !== "guest1@example.com"), mails.map((m) => m.to).join(","));
  const allHtml = mails.map((m) => m.html).join("\n");
  check("H11", "emails show stay dates as Oct 5 and Oct 9 (no timezone shift)", /Oct(ober)?\s+5/.test(allHtml) && /Oct(ober)?\s+9/.test(allHtml) && !/Oct(ober)?\s+4,/.test(allHtml), "dates not found or shifted");
  check("H12", "emails show the charged total $1,647.00", allHtml.includes("1,647.00"), "total not found in email html");
  const receipt = mails.find((m) => /receipt/i.test(m.subject));
  check("H13", "receipt shows 5% service fee $63.00 (not a flat fee)", receipt && receipt.html.includes("63.00"), receipt ? "receipt present, $63.00 missing" : "no receipt", "T-EM-09");
  check("H14", "receipt shows lodging tax $144.00", receipt && receipt.html.includes("144.00"), "tax line missing", "T-EM-09");
  const lookup = await api(`/api/bookings/${r.json.bookingReference}?email=GUEST1@example.com`);
  check("H15", "My Trips lookup works with ref + email (case-insensitive)", lookup.status === 200 && lookup.json?.booking?.status === "PAID", lookup.text);
  const wrong = await api(`/api/bookings/${r.json.bookingReference}?email=someone@else.com`);
  check("H16", "lookup with wrong email is 404", wrong.status === 404, wrong.status);
  const feedToken = (await api(`/api/admin/calendar-feeds`, { headers: { cookie: await adminCookie() } })).json;
  const url = JSON.stringify(feedToken).match(new RegExp(`/api/ical/${SB}[^"?]*\\?token=[a-f0-9]+`))?.[0];
  const feed = url ? await api(url) : { text: "" };
  check("H17", "Bunks export feed (for Airbnb) contains the paid stay 20261005→20261009", feed.text.includes("DTSTART;VALUE=DATE:20261005") && feed.text.includes("DTEND;VALUE=DATE:20261009"), feed.text.slice(0, 400));
  check("H18", "export feed does not leak guest name/email", !/QA Guest|guest1@example\.com/.test(feed.text), "PII in feed");
  const bad = await api(`/api/ical/${SB}.ics?token=deadbeef`);
  check("H19", "export feed rejects a bad token", bad.status === 404 || bad.status === 401 || bad.status === 403, bad.status);
});

def("Double booking protection", async () => {
  const a = await book({ guestEmail: "a@example.com" });
  const b = await book({ guestEmail: "b@example.com" });
  check("D1", "second guest blocked while first holds the dates", b.status === 409, `${b.status} ${b.text}`);
  check("D2", "409 carries a human-readable message", typeof b.json?.error === "string" || typeof b.json?.message === "string", b.text, "T-BK-05");
  await pay(a);
  const c = await book({ guestEmail: "c@example.com", checkIn: "2026-10-07", checkOut: "2026-10-11" });
  check("D3", "overlapping stay after payment is rejected", c.status === 409, c.status);
  const d = await book({ guestEmail: "d@example.com", checkIn: "2026-10-02", checkOut: "2026-10-05" });
  check("D4", "back-to-back stay ending on check-in day is allowed", d.status === 200, `${d.status} ${d.text}`);
  const e = await book({ guestEmail: "e@example.com", checkIn: "2026-10-08", checkOut: "2026-10-11" });
  check("D5", "stay starting on last night is rejected", e.status === 409, e.status);
});

def("Parallel checkout race", async () => {
  const rs = await Promise.all(Array.from({ length: 8 }, (_, i) => book({ guestEmail: `race${i}@example.com` })));
  const ok = rs.filter((r) => r.status === 200).length;
  check("R1", "8 simultaneous checkouts for the same dates → exactly 1 hold", ok === 1, rs.map((r) => r.status).join(","));
  const pending = await db.booking.count({ where: { status: "PENDING" } });
  check("R2", "exactly one PENDING row exists", pending === 1, pending);
});

def("Airbnb reservations block direct booking", async () => {
  const s = await forceSync(SB);
  check("A1", "sync-ical with cron secret succeeds", s.status === 200, s.text);
  const n = await db.blockedDate.count({ where: { source: "AIRBNB", propertyId: 2 } });
  check("A2", "Airbnb fixture imports 8 nights (Oct 10–13, Nov 1–4)", n === 8, n);
  const nights = (await db.blockedDate.findMany({ where: { source: "AIRBNB", propertyId: 2 }, orderBy: { date: "asc" } })).map((x) => x.date.toISOString().slice(0, 10));
  check("A3", "imported nights are exact (DTEND exclusive)", nights[0] === "2026-10-10" && nights[3] === "2026-10-13" && !nights.includes("2026-10-14"), nights.join(","));
  const r = await book({ checkIn: "2026-10-11", checkOut: "2026-10-15" });
  check("A4", "booking over an Airbnb reservation is rejected", r.status === 409, r.status);
  const ok = await book({ checkIn: "2026-10-14", checkOut: "2026-10-17", guestEmail: "after@example.com" });
  check("A5", "check-in on Airbnb guest's checkout day is allowed", ok.status === 200, `${ok.status} ${ok.text}`);
  const noauth = await api(`/api/properties/${SB}/sync-ical`, { method: "POST" });
  check("A6", "sync-ical without auth is rejected", noauth.status === 401 || noauth.status === 403, noauth.status);
});

def("Airbnb feed failures never erase reservations", async () => {
  await forceSync(SB);
  const before = await db.blockedDate.count({ where: { source: "AIRBNB", propertyId: 2 } });
  removeIcal("steamboat.ics");
  await forceSync(SB);
  const after404 = await db.blockedDate.count({ where: { source: "AIRBNB", propertyId: 2 } });
  check("F1", "feed returns 404 → existing Airbnb blocks kept", after404 === before, `${before} → ${after404}`);
  writeIcal("steamboat.ics", "<html><body>Please log in</body></html>");
  await forceSync(SB);
  check("F2", "feed returns HTML → blocks kept", (await db.blockedDate.count({ where: { source: "AIRBNB", propertyId: 2 } })) === before, "blocks changed");
  const full = fs.readFileSync(new URL("../fixtures/ical/steamboat.ics", import.meta.url), "utf8");
  writeIcal("steamboat.ics", full.slice(0, full.indexOf("DTSTART")));
  await forceSync(SB);
  const afterTrunc = await db.blockedDate.count({ where: { source: "AIRBNB", propertyId: 2 } });
  check("F3", "truncated feed (cut mid-event) → blocks kept", afterTrunc === before, `${before} → ${afterTrunc}`, "T-AV-01");
  writeIcal("steamboat.ics", "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n");
  const emptySync = await forceSync(SB);
  const afterEmpty = await db.blockedDate.count({ where: { source: "AIRBNB", propertyId: 2 } });
  check("F4", "valid but empty feed while future reservations exist → blocks kept, sync reports EMPTY_FEED", afterEmpty === before && emptySync.json?.reason === "EMPTY_FEED", `${before} → ${afterEmpty} ${emptySync.text}`, "T-AV-01");
  const duringEmpty = await book({ guestEmail: "during-empty@example.com", checkIn: "2026-10-20", checkOut: "2026-10-23" });
  check("F4b", "an empty Airbnb feed doesn't pause checkout (old blocks kept, so only over-blocks)", duringEmpty.status === 200, `${duringEmpty.status} ${duringEmpty.text}`, "review-2");
  const stillBlocked = await book({ guestEmail: "on-kept-block@example.com", checkIn: "2026-10-11", checkOut: "2026-10-15" });
  check("F4c", "kept Airbnb blocks still stop bookings on those nights", stillBlocked.status === 409, stillBlocked.status);
  const confirmed = await api(`/api/properties/${SB}/sync-ical`, { method: "POST", body: { allowEmpty: true }, headers: { cookie: await adminCookie() } });
  const afterConfirm = await db.blockedDate.count({ where: { source: "AIRBNB", propertyId: 2 } });
  check("F5", "admin can confirm an empty Airbnb calendar to clear blocks", confirmed.status === 200 && afterConfirm === 0, `${confirmed.status} ${afterConfirm}`, "T-AV-01");
  const cronForce = await api(`/api/properties/${SB}/sync-ical`, { method: "POST", body: { allowEmpty: true }, headers: { authorization: `Bearer ${CRON_SECRET}` } });
  check("F6", "cron secret alone cannot confirm an empty calendar", cronForce.status !== 200 || cronForce.json?.nights === 0, cronForce.text);
  restoreIcal();
  await forceSync(SB);
  removeIcal("steamboat.ics");
  clearEmails();
  const cron = await api("/api/cron/ical-sync", { headers: { authorization: `Bearer ${CRON_SECRET}` } });
  check("F7", "daily import failure emails an ops alert", cron.status === 200 && emails().some((m) => /Airbnb calendar import failed/.test(m.subject)), emails().map((m) => m.subject).join(" | "), "T-AV-02");
  // A new feed URL has no fresh import on the booking route, so checkout must read it now.
  await db.property.update({ where: { slug: SB }, data: { airbnbIcalUrl: "http://localhost:8765/steamboat-broken.ics" } });
  const blocked = await book({ guestEmail: "during-outage@example.com" });
  await db.property.update({ where: { slug: SB }, data: { airbnbIcalUrl: "http://localhost:8765/steamboat.ics" } });
  check("F8", "checkout pauses (503, friendly message) while the Airbnb import is failing", blocked.status === 503 && /try again|email us/i.test(blocked.json?.message ?? ""), `${blocked.status} ${blocked.text}`, "T-AV-02");
  restoreIcal();
  await forceSync(SB);
  const after = await book({ guestEmail: "after-recovery@example.com" });
  check("F9", "checkout resumes once the import works again", after.status === 200, `${after.status} ${after.text}`, "T-AV-02");
});

def("Airbnb booking that overlaps a paid direct stay raises an alarm", async () => {
  await forceSync(SB);
  const a = await book({ guestEmail: "direct@example.com" });
  await pay(a);
  clearEmails();
  const base = fs.readFileSync(new URL("../fixtures/ical/steamboat.ics", import.meta.url), "utf8");
  const clash = "BEGIN:VEVENT\r\nDTEND;VALUE=DATE:20261009\r\nDTSTART;VALUE=DATE:20261007\r\nUID:qa-clash@airbnb.com\r\nSUMMARY:Reserved\r\nEND:VEVENT\r\n";
  writeIcal("steamboat.ics", base.replace("END:VCALENDAR", clash + "END:VCALENDAR"));
  await forceSync(SB);
  const alerts = emails().filter((m) => /possible double booking/i.test(m.subject));
  check("DB1", "overlap with a paid direct booking emails an urgent alert", alerts.length === 1 && alerts[0].html.includes("2026-10-07"), emails().map((m) => m.subject).join(" | "), "T-AV-12");
  await forceSync(SB);
  check("DB2", "the alert is sent once, not on every sync", emails().filter((m) => /possible double booking/i.test(m.subject)).length === 1, "repeated");
  restoreIcal();
  const notAvail = "BEGIN:VEVENT\r\nDTEND;VALUE=DATE:20261009\r\nDTSTART;VALUE=DATE:20261007\r\nUID:qa-na@airbnb.com\r\nSUMMARY:Airbnb (Not available)\r\nEND:VEVENT\r\n";
  await db.emailLog.deleteMany({ where: { type: "SYSTEM_CALENDAR_SYNC_ERROR" } });
  clearEmails();
  writeIcal("steamboat.ics", base.replace("END:VCALENDAR", notAvail + "END:VCALENDAR"));
  await forceSync(SB);
  check("DB3", "a 'Not available' block (e.g. Airbnb mirroring our own booking) is not an alarm", emails().filter((m) => /double booking/i.test(m.subject)).length === 0, emails().map((m) => m.subject).join(" | "));
  restoreIcal();
});

def("A home listed in several places imports every calendar", async () => {
  const both = "http://localhost:8765/steamboat.ics\nhttp://localhost:8765/steamboat-vrbo.ics";
  await db.property.update({ where: { slug: SB }, data: { airbnbIcalUrl: both } });
  try {
    const s1 = await forceSync(SB);
    const nights = (await db.blockedDate.findMany({ where: { propertyId: 2, source: "AIRBNB" } })).map((x) => x.date.toISOString().slice(0, 10));
    check("MC1", "nights from both calendars are blocked (Airbnb Oct 10–13 + Vrbo Oct 20–22)", s1.status === 200 && nights.includes("2026-10-11") && nights.includes("2026-10-21") && !nights.includes("2026-10-23"), `${s1.status} ${nights.join(",")}`, "T-AV-15");
    const r = await book({ checkIn: "2026-10-19", checkOut: "2026-10-22" });
    check("MC2", "a direct booking over the Vrbo stay is rejected", r.status === 409, r.status, "T-AV-15");
    removeIcal("steamboat-vrbo.ics");
    const s2 = await forceSync(SB);
    const after = await db.blockedDate.count({ where: { propertyId: 2, source: "AIRBNB" } });
    check("MC3", "if one calendar fails, nothing is removed and the error names that calendar", s2.status === 502 && after === nights.length && /localhost/.test(s2.json?.error ?? ""), `${s2.status} ${after}/${nights.length} ${s2.text}`, "T-AV-15");
    restoreIcal();
    const cookie = await adminCookie();
    const check1 = await api(`/api/admin/calendar-check?slug=${SB}`, { headers: { cookie } });
    const feeds = check1.json?.feeds ?? [];
    check("MC4", "Check calendars lists each linked calendar with its stays, without guest names", feeds.length === 2 && feeds.every((f) => f.ok) && feeds[1].ranges.some((x) => x.start === "2026-10-20" && x.kind === "reservation") && !/Test Guest/.test(check1.text), check1.text.slice(0, 300), "T-AV-15");
    const anon = await api(`/api/admin/calendar-check?slug=${SB}`);
    check("MC5", "Check calendars requires admin", anon.status === 401, anon.status);
    const cookieSave = await api("/api/admin/properties/2/settings", { method: "PUT", headers: { cookie }, body: { airbnbIcalUrl: "https://a.example/x.ics\nnot a link" } });
    check("MC6", "saving a bad line in the calendar links is rejected with a clear message", cookieSave.status === 400, `${cookieSave.status} ${cookieSave.text.slice(0, 150)}`);
  } finally {
    await db.property.update({ where: { slug: SB }, data: { airbnbIcalUrl: "http://localhost:8765/steamboat.ics" } });
    restoreIcal();
  }
});

def("Late payment after the hold expired", async () => {
  const a = await book({ guestEmail: "slow@example.com" });
  await expireHold(a.json.bookingId);
  const b = await book({ guestEmail: "fast@example.com" });
  check("L1", "new guest can book once first hold expired", b.status === 200, b.status);
  await pay(b);
  clearEmails();
  const { webhook } = await pay(a);
  check("L2", "late payment webhook handled", webhook.status === 200, JSON.stringify(webhook));
  const slow = await db.booking.findUnique({ where: { id: a.json.bookingId } });
  check("L3", "late payer's booking is CANCELLED (no double booking)", slow.status === "CANCELLED", slow.status);
  const st = await stripe("/__test/state");
  check("L4", "late payer is refunded automatically", st.refunds.some((x) => x.payment_intent === slow.stripePaymentIntentId), JSON.stringify(st.refunds));
  const paidCount = await db.booking.count({ where: { status: "PAID" } });
  check("L5", "only one PAID booking for the dates", paidCount === 1, paidCount);
  const m = emails();
  check("L6", "ops/host alerted about the refunded conflict", m.some((x) => /refunded/i.test(x.subject)), m.map((x) => x.subject).join(" | "));
  check("L7", "late payer gets an explanation email", m.some((x) => x.to === "slow@example.com"), m.map((x) => `${x.to}:${x.subject}`).join(" | "), "T-EM-05");
});

def("A completed payment beats another guest's unpaid hold", async () => {
  const a = await book({ guestEmail: "expired@example.com" });
  await expireHold(a.json.bookingId);
  const b = await book({ guestEmail: "active@example.com" });
  await pay(a); // A's payment lands after A's hold expired, while B is on the payment form
  const aRow = await db.booking.findUnique({ where: { id: a.json.bookingId } });
  check("X1", "the guest whose payment went through keeps the stay", aRow.status === "PAID", `A=${aRow.status}`, "T-AV-03 (revised)");
  clearEmails();
  await pay(b);
  const bRow = await db.booking.findUnique({ where: { id: b.json.bookingId } });
  const st = await stripe("/__test/state");
  check("X2", "the unpaid guest who pays afterwards is refunded and told why", bRow.status === "CANCELLED" && st.refunds.some((r) => r.payment_intent === bRow.stripePaymentIntentId) && emails().some((m) => m.to === "active@example.com"), `B=${bRow.status}`, "T-AV-03 (revised)");
  check("X3", "exactly one PAID booking for the dates", (await db.booking.count({ where: { status: "PAID" } })) === 1, "count");
});

def("Failed restart keeps the guest's existing hold", async () => {
  await forceSync(SB);
  const a = await book({ guestEmail: "tabs@example.com" });
  const b = await book({ guestEmail: "tabs@example.com", checkIn: "2026-10-11", checkOut: "2026-10-14" }); // Airbnb-blocked
  check("T1", "second tab gets 409 for unavailable dates", b.status === 409, b.status);
  const row = await db.booking.findUnique({ where: { id: a.json.bookingId } });
  check("T2", "first tab's hold is still PENDING", row.status === "PENDING", row.status, "T-BK-03");
  const again = await book({ guestEmail: "tabs@example.com" });
  check("T3", "same guest restarting same dates reuses their hold", again.status === 200 && again.json.bookingId === a.json.bookingId, `${again.status} ${again.json?.bookingId} vs ${a.json.bookingId}`);
});

def("Webhook safety", async () => {
  const a = await book();
  const { pi } = await pay(a);
  const n1 = emails().length;
  const again = await stripe(`/__test/succeed/${pi}`);
  check("W1", "duplicate payment_intent.succeeded is a no-op", again.status === 200 && emails().length === n1, `${again.status} emails ${n1}→${emails().length}`);
  const forged = await api("/api/stripe", { method: "POST", body: { type: "payment_intent.succeeded", data: { object: { id: pi } } }, headers: { "stripe-signature": "t=1,v1=bad" } });
  check("W2", "unsigned/forged webhook rejected", forged.status === 400, forged.status);
});

def("Stripe outage releases the hold", async () => {
  await stripe("/__test/config", { failCreate: 3 });
  const a = await book({ guestEmail: "outage@example.com" });
  check("S1", "Stripe failure returns a friendly 5xx", a.status >= 500 && /try again/i.test(a.text), `${a.status} ${a.text}`);
  const pending = await db.booking.count({ where: { status: "PENDING" } });
  check("S2", "no dates left held after Stripe failure", pending === 0, pending);
  const b = await book({ guestEmail: "after-outage@example.com" });
  check("S3", "next guest can book the same dates", b.status === 200, b.status);
});

def("Admin cancel + refund", async () => {
  const cookie = await adminCookie();
  const a = await book();
  await pay(a);
  clearEmails();
  const c = await api(`/api/bookings/${a.json.bookingId}/cancel`, { method: "POST", body: { refund: "full" }, headers: { cookie } });
  check("C1", "admin cancel with full refund succeeds", c.status === 200 && c.json?.refundCents === EXPECTED_TOTAL, c.text);
  const row = await db.booking.findUnique({ where: { id: a.json.bookingId } });
  check("C2", "booking CANCELLED", row.status === "CANCELLED", row.status);
  const blocks = await db.blockedDate.count({ where: { source: "DIRECT" } });
  check("C3", "nights released", blocks === 0, blocks);
  const st = await stripe("/__test/state");
  check("C4", "Stripe refund issued for full amount", st.refunds.some((x) => x.payment_intent === row.stripePaymentIntentId && x.amount === EXPECTED_TOTAL), JSON.stringify(st.refunds));
  await stripe(`/__test/refund/${row.stripePaymentIntentId}`); // Stripe then sends charge.refunded
  const toGuest = emails().filter((m) => m.to === "guest1@example.com");
  check("C5", "guest gets one cancellation/refund email, not two", toGuest.length === 1, toGuest.map((m) => m.subject).join(" | "), "T-EM-04");
  const hostMail = emails().filter((m) => m.to !== "guest1@example.com");
  check("C6", "host alerts go to the support inbox, not hosts@bunks.com", hostMail.length > 0 && hostMail.every((m) => !String(m.to).includes("hosts@bunks.com")), hostMail.map((m) => m.to).join(","), "T-EM-11");
  const again = await book({ guestEmail: "rebook@example.com" });
  check("C7", "cancelled dates can be booked again", again.status === 200, again.status);
  const noauth = await api(`/api/bookings/${a.json.bookingId}/cancel`, { method: "POST", body: {} });
  check("C8", "cancel without admin session is 401", noauth.status === 401, noauth.status);
  const pend = await book({ guestEmail: "abandon@example.com", checkIn: "2026-11-10", checkOut: "2026-11-13" });
  const racing = await book({ guestEmail: "racing@example.com", checkIn: "2026-12-01", checkOut: "2026-12-04" });
  await stripe(`/__test/mark-succeeded/${racing.json.clientSecret.split("_secret")[0]}`);
  const raced = await api(`/api/bookings/${racing.json.bookingId}/cancel`, { method: "POST", body: { refund: "none" }, headers: { cookie } });
  const racedRow = await db.booking.findUnique({ where: { id: racing.json.bookingId } });
  check("C10", "releasing a hold whose payment just succeeded is refused (webhook not yet processed)", raced.status === 409 && racedRow.status === "PENDING", `${raced.status} ${racedRow.status}`, "review-4");
  clearEmails();
  await api(`/api/bookings/${pend.json.bookingId}/cancel`, { method: "POST", body: { refund: "full" }, headers: { cookie } });
  check("C9", "cancelling an unpaid hold sends no guest email", emails().filter((m) => m.to === "abandon@example.com").length === 0, emails().map((m) => m.subject).join(" | "), "T-EM-P2");
});

def("Declined card", async () => {
  const a = await book({ guestEmail: "declined@example.com" });
  const pi = a.json.clientSecret.split("_secret")[0];
  clearEmails();
  await stripe(`/__test/fail/${pi}`);
  await stripe(`/__test/fail/${pi}`);
  const m = emails().filter((x) => x.to === "declined@example.com");
  check("P1", "repeated declines during checkout don't spam the guest", m.length <= 1, `${m.length} emails`, "T-EM-06");
  const row = await db.booking.findUnique({ where: { id: a.json.bookingId } });
  check("P2", "hold kept so guest can retry", row.status === "PENDING", row.status);
});

def("Input validation", async () => {
  const cases = [
    ["V1", "stay under minimum (2 nights)", { checkIn: "2026-10-05", checkOut: "2026-10-07" }, 400, ""],
    ["V2", "check-in in the past", { checkIn: "2026-01-05", checkOut: "2026-01-09" }, 400, ""],
    ["V3", "checkout before check-in", { checkIn: "2026-10-09", checkOut: "2026-10-05" }, 400, ""],
    ["V4", "impossible date 2026-02-30", { checkIn: "2027-02-27", checkOut: "2027-02-30" }, 400, "T-BK-06"],
    ["V5", "absurd length (5 years)", { checkIn: "2026-12-01", checkOut: "2031-12-01" }, 400, "T-BK-04"],
    ["V6", "too many guests (20 for 6-guest home)", { guests: 20 }, 400, "T-BK-07"],
    ["V7", "non-string email", { guestEmail: 12345 }, 400, "T-BK-08"],
    ["V8", "malformed email", { guestEmail: "not-an-email" }, 400, "T-BK-08"],
    ["V9", "unknown property", { propertySlug: "nope" }, 404, ""],
    ["V10", "missing name", { guestName: "" }, 400, ""],
  ];
  for (const [id, label, o, want, ticket] of cases) {
    await resetData();
    const r = await book(o);
    check(id, `rejects ${label} with ${want}`, r.status === want, `${r.status} ${r.text.slice(0, 150)}`, ticket);
  }
  const garbage = await api("/api/bookings", { method: "POST", body: "{not json" });
  check("V11", "malformed JSON → 400 not 500", garbage.status === 400, garbage.status, "T-BK-08");
});

def("Trip access (door codes)", async () => {
  await db.property.update({ where: { slug: SB }, data: { lockboxCode: "1234" } });
  const today = new Date(); const ci = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));
  const co = new Date(ci.getTime() + 3 * 86400000);
  const iso = (d) => d.toISOString().slice(0, 10);
  const a = await book({ checkIn: iso(ci), checkOut: iso(co), guestEmail: "soon@example.com" });
  const pending = await api(`/api/trip-access/${a.json.bookingReference}?email=soon@example.com`);
  check("TA1", "codes hidden while unpaid", pending.json?.available === false, pending.text);
  await pay(a);
  const ok = await api(`/api/trip-access/${a.json.bookingReference}?email=soon@example.com`);
  check("TA2", "codes released for a paid stay starting tomorrow", ok.json?.available === true && ok.json?.codes?.lockboxCode === "1234", ok.text);
  const bad = await api(`/api/trip-access/${a.json.bookingReference}?email=x@example.com`);
  check("TA3", "wrong email → 404", bad.status === 404, bad.status);
  check("TA4", "response is no-store", /no-store/.test(ok.headers.get("cache-control") ?? ""), ok.headers.get("cache-control"));
});

def("Daily email automations", async () => {
  // "Tomorrow" in the property's own timezone (the cron uses property-local dates).
  const local = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(new Date());
  const [y, mo, da] = local.split("-").map(Number);
  const d = (n) => new Date(Date.UTC(y, mo - 1, da + n)).toISOString().slice(0, 10);
  await db.property.update({ where: { slug: SB }, data: { lockboxCode: "1234" } });
  clearEmails();
  const a = await book({ checkIn: d(1), checkOut: d(4), guestEmail: "tomorrow@example.com" });
  await pay(a); // booking-time emails (incl. the door code, since check-in is tomorrow) count too
  const p = await book({ checkIn: d(1), checkOut: d(4), guestEmail: "unpaid@example.com", propertySlug: SL });
  const noauth = await api("/api/cron/automations");
  check("E1", "cron without secret is 401", noauth.status === 401, noauth.status);
  const [r1, r2] = await Promise.all([
    api("/api/cron/automations", { headers: { authorization: `Bearer ${CRON_SECRET}` } }),
    api("/api/cron/automations", { headers: { authorization: `Bearer ${CRON_SECRET}` } }),
  ]);
  check("E2", "cron runs", r1.status === 200 || r2.status === 200, `${r1.status} ${r2.status} ${r1.text.slice(0, 200)}`);
  const m = emails().filter((x) => x.to === "tomorrow@example.com");
  const subjects = m.map((x) => x.subject);
  check("E3", "guest arriving tomorrow gets pre-arrival + door code", m.length >= 2 && m.some((x) => x.html.includes("1234")), subjects.join(" | "));
  check("E4", "two overlapping cron runs send each email once", new Set(subjects).size === subjects.length, subjects.join(" | "), "T-EM-01");
  check("E5", "unpaid holds get no automation emails", !emails().some((x) => x.to === "unpaid@example.com"), "unpaid guest emailed");
  const door = m.find((x) => x.html.includes("1234"));
  check("E6", "door-code email has no invented details (7711 backup lockbox, elk, propane)", door && !/7711|propane|elk/i.test(door.html), "found placeholder content", "T-EM-07");
  clearEmails();
  await api("/api/cron/automations", { headers: { authorization: `Bearer ${CRON_SECRET}` } });
  check("E7", "re-running the cron the same day sends nothing new", emails().filter((x) => x.to === "tomorrow@example.com").length === 0, emails().map((x) => x.subject).join(" | "));
  void p;
});

def("Missed confirmation emails are caught up", async () => {
  const a = await book({ guestEmail: "missed@example.com" });
  await pay(a);
  // Simulate the webhook's emails never going out (provider outage / timeout).
  await db.emailLog.deleteMany({ where: { bookingId: a.json.bookingId } });
  await db.booking.update({ where: { id: a.json.bookingId }, data: { createdAt: new Date(Date.now() - 2 * 3600_000) } });
  clearEmails();
  await api("/api/cron/automations", { headers: { authorization: `Bearer ${CRON_SECRET}` } });
  const first = emails().filter((m) => m.to === "missed@example.com").map((m) => m.subject);
  check("M1", "daily run re-sends the missed receipt + confirmation", first.some((x) => /receipt/i.test(x)) && first.length >= 2, first.join(" | "), "T-EM-03");
  clearEmails();
  await api("/api/cron/automations", { headers: { authorization: `Bearer ${CRON_SECRET}` } });
  check("M2", "catch-up doesn't repeat on the next run", emails().filter((m) => m.to === "missed@example.com").length === 0, emails().map((m) => m.subject).join(" | "), "T-EM-03");
  const fresh = await book({ guestEmail: "fresh@example.com", checkIn: "2026-11-10", checkOut: "2026-11-13" });
  await pay(fresh);
  clearEmails();
  await api("/api/cron/automations", { headers: { authorization: `Bearer ${CRON_SECRET}` } });
  check("M3", "bookings paid in the last hour are left to the webhook", emails().filter((m) => m.to === "fresh@example.com").length === 0, emails().map((m) => m.subject).join(" | "));
});

def("Guest messaging is email-only", async () => {
  const a = await book({ guestEmail: "chat@example.com" });
  await pay(a);
  clearEmails();
  const r = await api(`/api/bookings/${a.json.bookingId}/messages`, { method: "POST", body: { body: "hi", guestEmail: "chat@example.com", bookingReference: a.json.bookingReference } });
  check("GM1", "guest can't post in-app messages (410 with support email)", r.status === 410 && /@/.test(r.json?.error ?? ""), `${r.status} ${r.text}`, "T-SEC-06");
  check("GM2", "no host email triggered", emails().length === 0, emails().map((m) => m.subject).join(" | "));
});

def("Last-minute booking gets its door code at payment", async () => {
  await db.property.update({ where: { slug: SB }, data: { lockboxCode: "5150" } });
  const local = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(new Date());
  const [y, mo, da] = local.split("-").map(Number);
  const d = (n) => new Date(Date.UTC(y, mo - 1, da + n)).toISOString().slice(0, 10);
  const a = await book({ checkIn: d(0), checkOut: d(3), guestEmail: "lastminute@example.com" });
  check("LM1", "same-day check-in can be booked", a.status === 200, `${a.status} ${a.text}`);
  clearEmails();
  await pay(a);
  const door = emails().filter((m) => m.to === "lastminute@example.com" && m.html.includes("5150"));
  check("LM2", "door code emailed immediately on payment", door.length === 1, emails().map((m) => m.subject).join(" | "), "T-EM-12");
  clearEmails();
  await api("/api/cron/automations", { headers: { authorization: `Bearer ${CRON_SECRET}` } });
  check("LM3", "cron doesn't send the door code again", !emails().some((m) => m.to === "lastminute@example.com" && m.html.includes("5150")), emails().map((m) => m.subject).join(" | "));
  const far = await book({ checkIn: "2026-11-10", checkOut: "2026-11-13", guestEmail: "early@example.com" });
  clearEmails();
  await pay(far);
  check("LM4", "far-future booking gets no door code at payment", !emails().some((m) => m.html.includes("5150")), "door code sent early");
  await db.property.update({ where: { slug: SB }, data: { lockboxCode: null } });
});

def("Owner price overrides and blocks", async () => {
  const cookie = await adminCookie();
  const r1 = await api("/api/admin/properties/2/special-pricing", { method: "POST", headers: { cookie }, body: { startDate: "2026-10-06", endDate: "2026-10-06", price: 500, note: "event night" } });
  check("OP1", "admin sets a $500 override for Oct 6", r1.status === 200 || r1.status === 201, `${r1.status} ${r1.text.slice(0, 200)}`);
  const q = await api(`/api/properties/${SB}/check-availability`, { method: "POST", body: { checkIn: "2026-10-05", checkOut: "2026-10-09" } });
  // 3 × 31500 + 500×0.9=45000 → 139500 nightly
  check("OP2", "quote uses the override (10% off $500) for that night", q.json?.quote?.nightlySubtotalCents === 139500, JSON.stringify(q.json?.quote?.nightlyLineItems));
  const r2 = await api("/api/admin/properties/2/special-pricing", { method: "POST", headers: { cookie }, body: { startDate: "2026-10-20", endDate: "2026-10-21", isBlocked: true, note: "owner stay" } });
  check("OP3", "admin blocks Oct 20–21", r2.status === 200 || r2.status === 201, `${r2.status} ${r2.text.slice(0, 200)}`);
  const b = await book({ checkIn: "2026-10-19", checkOut: "2026-10-22" });
  check("OP4", "owner-blocked nights can't be booked", b.status === 409, b.status);
  const ok = await book({ checkIn: "2026-10-22", checkOut: "2026-10-25", guestEmail: "afterblock@example.com" });
  check("OP5", "night after the block is bookable (block covers exactly the chosen nights)", ok.status === 200, `${ok.status} ${ok.text}`);
  const feeds = (await api("/api/admin/calendar-feeds", { headers: { cookie } })).json;
  const url = JSON.stringify(feeds).match(new RegExp(`/api/ical/${SB}[^"?]*\\?token=[a-f0-9]+`))?.[0];
  const feed = url ? (await api(url)).text : "";
  check("OP6", "owner block is exported to Airbnb (20261020→20261022)", feed.includes("DTSTART;VALUE=DATE:20261020") && feed.includes("DTEND;VALUE=DATE:20261022"), feed.slice(0, 500));
});

def("Summerland booking (no taxes configured)", async () => {
  await forceSync(SL);
  const blocked = await book({ propertySlug: SL, checkIn: "2026-10-21", checkOut: "2026-10-24" });
  check("SL1", "Summerland Airbnb nights are blocked", blocked.status === 409, blocked.status);
  const r = await book({ propertySlug: SL, checkIn: "2026-10-05", checkOut: "2026-10-08", guests: 4, guestEmail: "beach@example.com" });
  // 3 weekday nights × 37500×0.9=33750 → 101250; fee 5063 (rounded); cleaning 15000
  check("SL2", "Summerland total = nights + 5% fee + cleaning, no tax", r.json?.totalPriceCents === 101250 + 5063 + 15000, r.json?.totalPriceCents);
  const tooMany = await book({ propertySlug: SL, checkIn: "2026-11-05", checkOut: "2026-11-08", guests: 5, guestEmail: "big@example.com" });
  check("SL3", "5 guests rejected for the 4-guest bungalow", tooMany.status === 400, tooMany.status);
});

def("Partial refund on cancel", async () => {
  const cookie = await adminCookie();
  const a = await book();
  await pay(a);
  const c = await api(`/api/bookings/${a.json.bookingId}/cancel`, { method: "POST", headers: { cookie }, body: { refund: 50000 } });
  check("PR1", "partial refund of $500 accepted", c.status === 200 && c.json?.refundCents === 50000, c.text);
  const st = await stripe("/__test/state");
  check("PR2", "Stripe refund is exactly $500", st.refunds.some((x) => x.amount === 50000), JSON.stringify(st.refunds));
  const bad = await book({ guestEmail: "x2@example.com" });
  check("PR3", "dates freed after cancel", bad.status === 200, bad.status);
  await pay(bad);
  const junk = await api(`/api/bookings/${bad.json.bookingId}/cancel`, { method: "POST", headers: { cookie }, body: { refund: "abc" } });
  const still = await db.booking.findUnique({ where: { id: bad.json.bookingId } });
  check("PR4", "a typo'd refund amount is rejected and the booking stays PAID", junk.status === 400 && still.status === "PAID", `${junk.status} ${still.status}`, "T-BK-10");
});

def("Owner Home Hub requests", async () => {
  const ok = await api("/api/owner-interest", { method: "POST", body: { name: "Pat <b>Owner</b>", email: "Pat@Example.com", location: "Summerland, CA", properties: "2", listingUrl: "", message: "Hi" } });
  const mail = emails().find((m) => /Home Hub request/.test(m.subject));
  check("OW1", "a valid request emails the support inbox with the owner as reply-to", ok.status === 200 && mail && mail.replyTo === "pat@example.com" && !String(mail.to).includes("example.com"), `${ok.status} ${JSON.stringify(mail && { to: mail.to, replyTo: mail.replyTo })}`);
  check("OW2", "owner-supplied text is escaped in the email", mail && mail.html.includes("&lt;b&gt;Owner&lt;/b&gt;"), "not escaped");
  const bad = await api("/api/owner-interest", { method: "POST", body: { name: "X", email: "nope", location: "Y" } });
  check("OW3", "invalid email rejected with a readable message", bad.status === 400 && /valid email/i.test(bad.json?.error ?? ""), `${bad.status} ${bad.text}`);
  const missing = await api("/api/owner-interest", { method: "POST", body: "{" });
  check("OW4", "malformed body → 400", missing.status === 400, missing.status);
});

def("Wi-Fi lead capture", async () => {
  const ok = await api("/api/wifi-lead", { method: "POST", body: { email: "Wifi@Example.com", name: "Guest", propertySlug: SB } });
  check("WL1", "valid lead accepted", ok.status === 200, ok.text);
  check("WL2", "response doesn't expose internal user id", ok.json && !("userId" in ok.json), ok.text, "T-SEC-04");
  const bad = await api("/api/wifi-lead", { method: "POST", body: { email: "nope" } });
  check("WL3", "invalid email rejected", bad.status === 400, bad.status);
  const long = await api("/api/wifi-lead", { method: "POST", body: { email: "long@example.com", name: "x".repeat(5000) } });
  check("WL4", "absurdly long name rejected", long.status === 400, long.status, "T-SEC-04");
  const cookie = await adminCookie();
  await api("/api/wifi-lead", { method: "POST", body: { email: "csv@example.com", name: "=HYPERLINK(\"http://evil\",\"x\")" } });
  const csv = await api("/api/admin/guests?format=csv", { headers: { cookie } });
  check("WL5", "guest CSV export neutralises formulas", !/(^|,)"?=HYPERLINK/m.test(csv.text), csv.text.slice(0, 300), "T-SEC-03");
});

def("Address, Wi-Fi and guides only for paid guests", async () => {
  const PRIVATE = /Lillie Ave|6th Street|Townhouse ?#?2|Alpen Glow/;
  for (const page of ["/", `/property/${SB}`, `/property/${SL}`, "/owners"]) {
    const r = await api(page);
    check("PV1", `public page ${page} has no address or Wi-Fi`, r.status === 200 && !PRIVATE.test(r.text), r.text.match(PRIVATE)?.[0] ?? r.status, "T-SEC-10");
  }
  for (const pdf of ["/Steamboat%20Welcome%20Guide.pdf", "/Steamboat%20Brochure.pdf", "/Lillie%20Guidebook.pdf"]) {
    const r = await api(pdf);
    check("PV2", `old public guide ${decodeURIComponent(pdf)} is gone`, r.status === 404, r.status, "T-SEC-11");
  }
  for (const kind of ["guide", "brochure"]) {
    const anon = await api(`/api/guides/${SB}/${kind}`);
    const admin = await fetch(`http://localhost:3000/api/guides/${SB}/${kind}`, { headers: { cookie: await adminCookie() } });
    check("PV9", `Steamboat ${kind} PDF: admins can open it, anonymous visitors can't`, anon.status === 403 && admin.status === 200 && admin.headers.get("content-type") === "application/pdf", `${anon.status}/${admin.status}`, "T-SEC-11");
  }
  const r = await book();
  const ref = r.json.bookingReference;
  const unpaid = await api(`/api/bookings/${ref}?email=guest1@example.com`);
  check("PV3", "unpaid booking lookup has no address, Wi-Fi or guide", unpaid.status === 200 && !unpaid.json.booking.secure && !PRIVATE.test(unpaid.text), unpaid.text.slice(0, 300));
  await pay(r);
  const paid = await api(`/api/bookings/${ref}?email=guest1@example.com`);
  const secure = paid.json?.booking?.secure;
  check("PV4", "paid booking lookup returns address, Wi-Fi and directions", /6th Street/.test(secure?.address ?? "") && !!secure?.wifiSsid && secure?.directions?.length === 2, JSON.stringify(secure).slice(0, 300));
  const guide = secure?.guideUrl ? await fetch(`http://localhost:3000${secure.guideUrl}`) : null;
  check("PV5", "signed guide link serves the PDF", guide?.status === 200 && guide.headers.get("content-type") === "application/pdf" && /no-store/.test(guide.headers.get("cache-control") ?? ""), guide?.status);
  const tampered = secure?.guideUrl?.replace(/sig=[0-9a-f]/, (m) => (m.endsWith("0") ? "sig=1" : "sig=0"));
  check("PV6", "tampered guide link is refused", (await api(tampered ?? "/api/guides/x/guide")).status === 403, tampered);
  const otherSlug = secure?.guideUrl?.replace(SB, SL);
  check("PV6b", "a link can't be reused for another home", (await api(otherSlug ?? "/api/guides/x/guide")).status === 403, otherSlug);
  const mailHtml = emails().map((m) => m.html).join("\n");
  check("PV7", "guest emails link the signed guide, not a public PDF", mailHtml.includes("/api/guides/") && !/Steamboat%20|Lillie%20Guidebook/.test(mailHtml), "no signed guide link in emails");
  await db.booking.update({ where: { publicReference: ref }, data: { status: "CANCELLED" } });
  check("PV8", "guide link stops working once the booking is cancelled", (await api(secure?.guideUrl ?? "/api/guides/x/guide")).status === 403, "still served");
});

def("Airbnb price check (comparison only)", async () => {
  const LISTING = "1552191060469626901";
  const auth = { authorization: "Bearer qa-price-secret" };
  const original = (await db.property.findUnique({ where: { slug: SB } })).airbnbIcalUrl;
  fs.mkdirSync(`${ICAL_DIR}/calendar/ical`, { recursive: true });
  fs.copyFileSync(`${ICAL_DIR}/steamboat.ics`, `${ICAL_DIR}/calendar/ical/${LISTING}.ics`);
  await db.property.update({ where: { slug: SB }, data: { airbnbIcalUrl: `http://localhost:8765/calendar/ical/${LISTING}.ics` } });
  // Import the Airbnb blocks first, as production always has them, so scenarios skip those dates.
  await forceSync(SB);
  try {
    check("PC1", "scenarios need the price-check secret", (await api("/api/price-check/scenarios")).status === 401, "open");
    const sc = await api("/api/price-check/scenarios", { headers: auth });
    const mine = (sc.json?.scenarios ?? []).filter((s) => s.listingId === LISTING);
    const nights = new Set(mine.map((s) => (Date.parse(s.checkOut) - Date.parse(s.checkIn)) / 86400000));
    check("PC2", "scenarios: Steamboat listing from its calendar link, 3- and 7-night stays, 2 adults, USD/en", sc.json?.currency === "USD" && sc.json?.locale === "en" && typeof sc.json?.runId === "string" && mine.length >= 4 && nights.has(3) && nights.has(7) && mine.every((s) => s.adults === 2 && s.pets === 0), JSON.stringify(sc.json).slice(0, 300));
    const pick = mine[0];
    const bunks = await api(`/api/properties/${SB}/check-availability`, { method: "POST", body: { checkIn: pick.checkIn, checkOut: pick.checkOut, guests: 2 } });
    const preTax = bunks.json.quote.totalPriceCents - bunks.json.quote.taxCents;
    const post = (quotes) => api("/api/price-check/results", { method: "POST", headers: auth, body: { runId: sc.json.runId, capturedAt: new Date().toISOString(), runner: { bookItHash: "x", version: "qa" }, quotes } });
    clearEmails();
    const good = await post([{ scenarioId: pick.scenarioId, status: "ok", totalCents: Math.round(preTax * 1.25), currency: "USD", feesIncluded: true, cancellation: "Free cancellation before X" }]);
    const c = good.json?.comparisons?.[0];
    const digest = emails().find((m) => /all 1 compared stays save at least 5%/.test(m.subject));
    check("PC3", "comparison uses Bunks' pre-tax total; 20% saving → OK, summary email to ali@ lists both prices", c?.status === "compared" && c?.bunksCents === preTax && c?.savingsPct === 20 && digest?.to === "ali@bunks.com" && digest.html.includes("20%") && digest.html.includes("OK"), JSON.stringify(good.json));
    clearEmails();
    const low = await post([{ scenarioId: pick.scenarioId, status: "ok", totalCents: Math.round(preTax * 1.02), currency: "USD", feesIncluded: true }]);
    const mail = emails().find((m) => /saves less than 5%/.test(m.subject));
    check("PC4", "saving below the 5% target → below-target and an alert email", low.json?.comparisons?.[0]?.status === "below-target" && !!mail, JSON.stringify(low.json?.comparisons));
    clearEmails();
    const blocked = await post([{ scenarioId: pick.scenarioId, status: "blocked", error: "Airbnb denied access (HTTP 403)" }]);
    check("PC5", "blocked/failed quotes are reported, not compared, and alerted", blocked.json?.comparisons?.[0]?.status === "airbnb-failed" && emails().some((m) => /quote.* failed/.test(m.subject)), JSON.stringify(blocked.json));
    const forged = await post([{ scenarioId: `${SB}|999|${pick.checkIn}|${pick.checkOut}|2|0`, status: "ok", totalCents: 100000, currency: "USD" }]);
    check("PC6", "a quote for a listing that isn't in the home's calendar links is rejected as invalid", forged.json?.comparisons?.[0]?.status === "invalid", JSON.stringify(forged.json));
    const bad = await post([{ scenarioId: pick.scenarioId, status: "ok", totalCents: 0, currency: "USD" }]);
    const eur = await post([{ scenarioId: pick.scenarioId, status: "ok", totalCents: 1000, currency: "EUR" }]);
    check("PC7", "malformed quotes (zero price, non-USD) → 400", bad.status === 400 && eur.status === 400, `${bad.status}/${eur.status}`);
    // Booked on Bunks → dropped from scenarios.
    const held = await book({ checkIn: pick.checkIn, checkOut: pick.checkOut, guestEmail: "pc@example.com" });
    if (held.status !== 200) throw new Error(`booking for PC8 failed: ${held.status} ${held.text}`);
    await pay(held);
    const after = await api("/api/price-check/scenarios", { headers: auth });
    check("PC8", "stays already booked on Bunks aren't sent to the runner", !(after.json?.scenarios ?? []).some((s) => s.scenarioId === pick.scenarioId), "still listed");
    // Staleness: last report 40h ago → the daily cron alerts.
    clearEmails();
    await db.featureToggle.update({ where: { key: "price-check:last-results" }, data: { updatedAt: new Date(Date.now() - 40 * 3600_000) } });
    await api("/api/cron/ical-sync", { headers: { authorization: `Bearer ${CRON_SECRET}` } });
    check("PC9", "daily job alerts when the price runner hasn't reported for 36h", emails().some((m) => /no Airbnb results in over 36 hours/.test(m.subject)), emails().map((m) => m.subject).join(" | "));
  } finally {
    await db.property.update({ where: { slug: SB }, data: { airbnbIcalUrl: original } });
    await db.featureToggle.deleteMany({ where: { key: "price-check:last-results" } });
  }
});

def("Airbnb pricing: nightly rates copied from Airbnb", async () => {
  const LISTING = "1552191060469626901"; // Steamboat's source listing
  const auth = { authorization: "Bearer qa-price-secret" };
  const original = (await db.property.findUnique({ where: { slug: SB } })).airbnbIcalUrl;
  const property = await db.property.findUnique({ where: { slug: SB } });
  fs.mkdirSync(`${ICAL_DIR}/calendar/ical`, { recursive: true });
  fs.copyFileSync(`${ICAL_DIR}/steamboat.ics`, `${ICAL_DIR}/calendar/ical/${LISTING}.ics`);
  await db.property.update({ where: { slug: SB }, data: { airbnbIcalUrl: `http://localhost:8765/calendar/ical/${LISTING}.ics` } });
  await forceSync(SB);
  await db.featureToggle.update({ where: { key: "airbnbPricing" }, data: { enabled: true } });
  const quoteFor = (s) => api(`/api/properties/${SB}/check-availability`, { method: "POST", body: { checkIn: s.checkIn, checkOut: s.checkOut, guests: 2 } });
  const post = (quotes) => api("/api/price-check/results", { method: "POST", headers: auth, body: { runId: "qa", capturedAt: new Date().toISOString(), runner: { bookItHash: "x", version: "qa" }, quotes } });
  // Airbnb all-in quote for 3 nights at $400 with $250 cleaning and a 14.1% guest fee.
  const ALL_IN = Math.round((3 * 40000 + 25000) * 1.141);
  try {
    const sc = (await api("/api/price-check/scenarios", { headers: auth })).json?.scenarios ?? [];
    const mine = sc.filter((s) => s.listingId === LISTING);
    const nights = (s) => (Date.parse(s.checkOut) - Date.parse(s.checkIn)) / 86400000;
    check("AR1", "scenarios: rotating 3-night windows on the source listing, at most 30, earliest first", mine.length > 4 && sc.length <= 30 && mine.every((s) => nights(s) === 3 && s.adults === 2) && mine[0].checkIn < mine[mine.length - 1].checkIn, JSON.stringify(sc.slice(0, 3)));
    const [w1, w2, w3, w4, w5] = mine;
    const before = await quoteFor(w1);
    check("AR2", "no Airbnb rate yet → the stay can't be priced (no fallback to base rates)", before.json?.available === false && before.json?.reason === "PRICE_UNAVAILABLE" && /email us/.test(before.json?.message ?? ""), before.text);
    const blocked = await book({ checkIn: w3.checkIn, checkOut: w3.checkOut, guestEmail: "ar@example.com" });
    check("AR3", "checkout refuses an unpriced stay (409, friendly message)", blocked.status === 409 && blocked.json?.reason === "PRICE_UNAVAILABLE", `${blocked.status} ${blocked.text}`);
    clearEmails();
    const res = await post([{ scenarioId: w1.scenarioId, status: "ok", totalCents: ALL_IN, currency: "USD", feesIncluded: true }]);
    const rows = await db.specialRate.findMany({ where: { propertyId: property.id, date: { gte: new Date(w1.checkIn), lt: new Date(w1.checkOut) } } });
    check("AR4", "quote → nightly rate backed out ($400) and saved for each night as auto:airbnb", rows.length === 3 && rows.every((r) => Math.abs(r.price - 40000) <= 1 && r.note === "auto:airbnb") && res.json?.rateUpdates?.[0]?.nightlyCents !== undefined, JSON.stringify(res.json?.rateUpdates));
    const after = await quoteFor(w1);
    check("AR5", "the stay is now bookable at Airbnb's rate less 10%", after.json?.available === true && Math.abs(after.json.quote.nightlySubtotalCents - 3 * 36000) <= 3, after.text.slice(0, 300));
    check("AR6", "run email lists the copied rates", emails().some((m) => /repriced from Airbnb/.test(m.subject) && /Nightly rates copied from Airbnb/.test(m.html)), emails().map((m) => m.subject).join(" | "));
    // A manual override wins over Airbnb.
    await db.specialRate.create({ data: { propertyId: property.id, date: new Date(w2.checkIn), price: 99900, note: "Owner holiday rate" } });
    const manual = await post([{ scenarioId: w2.scenarioId, status: "ok", totalCents: ALL_IN, currency: "USD" }]);
    const kept = await db.specialRate.findUnique({ where: { propertyId_date: { propertyId: property.id, date: new Date(w2.checkIn) } } });
    check("AR7", "a manual date override is never overwritten by Airbnb", kept.price === 99900 && kept.note === "Owner holiday rate" && manual.json?.rateUpdates?.[0]?.skippedManual === 1, JSON.stringify(manual.json?.rateUpdates));
    const silly = await post([{ scenarioId: w3.scenarioId, status: "ok", totalCents: 30000, currency: "USD" }]);
    const none = await db.specialRate.count({ where: { propertyId: property.id, price: { lt: 5000 } } });
    check("AR8", "an implausible derived rate (<$50/night) is reported, not saved", none === 0 && /outside/.test(silly.json?.rateUpdates?.[0]?.error ?? ""), JSON.stringify(silly.json?.rateUpdates));
    const next = (await api("/api/price-check/scenarios", { headers: auth })).json?.scenarios ?? [];
    check("AR9", "freshly priced nights aren't re-quoted in the next run", !next.some((s) => s.checkIn === w1.checkIn && s.listingId === LISTING), "w1 re-quoted");
    // Airbnb's per-night breakdown: used when it adds up, otherwise the stay's average.
    const lines = [40000, 41000, 42000];
    const exactTotal = Math.round((lines.reduce((a, b) => a + b, 0) + 25000) * 1.141);
    const breakdown = lines.map((cents, i) => ({ label: `Night ${i + 1}, Nov ${10 + i}`, cents }));
    clearEmails();
    const exact = await post([{ scenarioId: w4.scenarioId, status: "ok", totalCents: exactTotal, currency: "USD", nightlyBreakdown: breakdown }]);
    const exactRows = await db.specialRate.findMany({ where: { propertyId: property.id, date: { gte: new Date(w4.checkIn), lt: new Date(w4.checkOut) } }, orderBy: { date: "asc" } });
    check("AR12", "per-night breakdown that adds up → each night saved at its own Airbnb rate, email lists each night", exact.json?.rateUpdates?.[0]?.exact === true && exactRows.map((r) => r.price).join() === lines.join() && emails().some((m) => m.html.includes("$420.00") && !m.html.includes("3-night average")), JSON.stringify(exact.json?.rateUpdates));
    const wrong = await post([{ scenarioId: w5.scenarioId, status: "ok", totalCents: ALL_IN, currency: "USD", nightlyBreakdown: lines.map((cents) => ({ label: "Nov 1", cents: cents + 5000 })) }]);
    const avgRows = await db.specialRate.findMany({ where: { propertyId: property.id, date: { gte: new Date(w5.checkIn), lt: new Date(w5.checkOut) } } });
    check("AR13", "a breakdown that doesn't add up falls back to the 3-night average", wrong.json?.rateUpdates?.[0]?.exact === false && avgRows.length === 3 && avgRows.every((r) => Math.abs(r.price - 40000) <= 1), JSON.stringify(wrong.json?.rateUpdates));
    const garbage = await post([{ scenarioId: w5.scenarioId, status: "ok", totalCents: ALL_IN, currency: "USD", nightlyBreakdown: [{ label: 5, cents: "x" }] }]);
    check("AR14", "a malformed breakdown doesn't reject the quote", garbage.status === 200 && garbage.json?.rateUpdates?.[0]?.exact === false, `${garbage.status} ${garbage.text.slice(0, 200)}`);
    // Weekly discount: Steamboat mirrors Airbnb's 10% off 7+ nights, applied before Bunks' 10%.
    const day = (offset) => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + offset));
    const iso = (d) => d.toISOString().slice(0, 10);
    for (let i = 0; i < 7; i += 1) {
      await db.specialRate.upsert({ where: { propertyId_date: { propertyId: property.id, date: day(150 + i) } }, create: { propertyId: property.id, date: day(150 + i), price: 40000, note: "auto:airbnb" }, update: { price: 40000, note: "auto:airbnb", isBlocked: false } });
    }
    const week = await api(`/api/properties/${SB}/check-availability`, { method: "POST", body: { checkIn: iso(day(150)), checkOut: iso(day(157)), guests: 2 } });
    const six = await api(`/api/properties/${SB}/check-availability`, { method: "POST", body: { checkIn: iso(day(150)), checkOut: iso(day(156)), guests: 2 } });
    check("AR15", "7 nights: Airbnb's 10% weekly discount, then Bunks' 10% ($400 → $360 Airbnb-equivalent → $324)", week.json?.quote?.undiscountedNightlySubtotalCents === 7 * 36000 && week.json?.quote?.nightlySubtotalCents === 7 * 32400, week.text.slice(0, 300));
    check("AR16", "6 nights: no weekly discount ($400 → $360)", six.json?.quote?.nightlySubtotalCents === 6 * 36000 && six.json?.quote?.undiscountedNightlySubtotalCents === 6 * 40000, six.text.slice(0, 300));
    // A home whose source listing isn't linked stays bookable on its base rates.
    const summer = await api(`/api/properties/${SL}/check-availability`, { method: "POST", body: { checkIn: w1.checkIn, checkOut: w1.checkOut, guests: 2 } });
    check("AR17", "home not linked to its Airbnb listing stays on base rates instead of becoming unbookable", summer.json?.available === true && !!summer.json?.quote, summer.text.slice(0, 200));
    const features = (await api("/api/admin/features", { headers: { cookie: await adminCookie() } })).json?.features ?? [];
    const flag = features.find((f) => f.key === "airbnbPricing");
    check("AR18", "Admin → Pricing says Airbnb pricing is active and names the unlinked home", flag?.active === true && /^Active for Downtown Steamboat/.test(flag?.note ?? "") && /Summerland.*needs Airbnb listing 1734161844121212601/.test(flag?.note ?? ""), JSON.stringify(flag));
    // Stale Airbnb rates are ignored.
    await db.specialRate.updateMany({ where: { propertyId: property.id, note: "auto:airbnb" }, data: { updatedAt: new Date(Date.now() - 8 * 86400000) } });
    const stale = await quoteFor(w1);
    check("AR10", "Airbnb rates older than 7 days are not used", stale.json?.reason === "PRICE_UNAVAILABLE", stale.text.slice(0, 200));
    // Switch off → base rates again.
    await db.featureToggle.update({ where: { key: "airbnbPricing" }, data: { enabled: false } });
    const off = await quoteFor(w3);
    check("AR11", "switching Airbnb pricing off in Admin → Pricing falls back to the base rates", off.json?.available === true && !!off.json?.quote, off.text.slice(0, 200));
  } finally {
    await db.featureToggle.update({ where: { key: "airbnbPricing" }, data: { enabled: false } });
    await db.specialRate.deleteMany({ where: { propertyId: property.id } });
    await db.property.update({ where: { slug: SB }, data: { airbnbIcalUrl: original } });
  }
});

def("Admin endpoints require a session", async () => {
  const routes = [
    ["POST", "/api/admin/bookings/lookup"], ["GET", "/api/admin/bookings/messages"], ["GET", "/api/admin/calendar-feeds"],
    ["POST", "/api/admin/emails/send-sample"], ["GET", "/api/admin/features"], ["GET", "/api/admin/guests"],
    ["POST", "/api/admin/marketing/send"], ["GET", "/api/admin/ops-details"], ["GET", "/api/admin/properties"],
    ["POST", "/api/admin/properties/1/rates"], ["PUT", "/api/admin/properties/1/settings"], ["POST", "/api/admin/properties/1/special-pricing"],
    ["DELETE", "/api/admin/properties/1/special-pricing/1"], ["GET", "/api/admin/properties/settings"],
  ];
  const bad = [];
  for (const [method, p] of routes) {
    const r = await api(p, { method, body: method === "GET" ? undefined : {} });
    if (r.status !== 401 && r.status !== 403) bad.push(`${method} ${p} → ${r.status}`);
  }
  check("AD1", `all ${routes.length} admin API routes reject anonymous calls`, bad.length === 0, bad.join("; "));
  const wrong = await api("/api/admin/login", { method: "POST", body: { email: "ali@bunks.com", password: "wrong" } });
  check("AD2", "wrong admin password → 401", wrong.status === 401, wrong.status);
  const forged = await api("/api/admin/properties", { headers: { cookie: "bunks_admin_session=eyJ4IjoxfQ.abc" } });
  check("AD3", "forged session cookie rejected", forged.status === 401, forged.status);
});

// ---- runner ----
const started = Date.now();
for (const s of scenarios) {
  if (filter && !s.name.toLowerCase().includes(filter.toLowerCase())) continue;
  console.log(`\n## ${s.name}`);
  scenario(s.name);
  try {
    await resetData();
    await s.fn();
  } catch (e) {
    check("ERR", `scenario crashed`, false, e.stack || e);
  }
}
await resetData();
await db.property.update({ where: { slug: SB }, data: { lockboxCode: null } }).catch(() => {});
const pass = results.filter((r) => r.pass).length;
console.log(`\n${pass}/${results.length} checks passed in ${((Date.now() - started) / 1000).toFixed(1)}s`);
fs.mkdirSync(new URL("../results/", import.meta.url), { recursive: true });
const out = new URL(`../results/e2e-${process.env.QA_RUN_LABEL || new Date().toISOString().replace(/[:.]/g, "-")}.json`, import.meta.url);
fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), pass, total: results.length, results }, null, 2));
console.log(`results → ${out.pathname}`);
await db.$disconnect();
process.exit(0);
