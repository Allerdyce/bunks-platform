// Browser smoke test of the guest journey and admin, against the local QA stack.
// Usage: PLAYWRIGHT_MODULE=/path/to/node_modules/playwright/index.mjs SHOTS=/tmp/shots node qa/ui/smoke.mjs
import fs from "node:fs";
import { BASE, SB, SL, db, resetData, forceSync, stripe, check, results, scenario, ADMIN, book, pay, D } from "../e2e/lib.mjs";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const SHOTS = process.env.SHOTS || "/tmp/bunks-qa/shots";
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
// External hosts (Stripe.js, fonts, map tiles, images) are unreachable in the sandbox; ignore their failures.
const IGNORED = /Failed to load Stripe\.js|js\.stripe\.com|m\.stripe|fonts\.(googleapis|gstatic)|unsplash|googletagmanager|vercel-insights|_vercel|open-meteo|images\.|api\.mapbox/;

async function newPage(viewport, timezoneId = "America/Denver") {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, timezoneId });
  const page = await context.newPage();
  page.problems = [];
  page.on("pageerror", (e) => { if (!IGNORED.test(e.message)) page.problems.push(`pageerror: ${e.message}`); });
  page.on("console", (m) => { if (m.type() === "error" && !IGNORED.test(m.text()) && !IGNORED.test(m.location()?.url ?? "")) page.problems.push(`console: ${m.text().slice(0, 200)}`); });
  page.on("response", (r) => { if (r.status() >= 500 && !IGNORED.test(r.url())) page.problems.push(`HTTP ${r.status()} ${r.url()}`); });
  return page;
}
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
const dayLabel = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

await resetData();
await forceSync(SB);
// Set before any page loads: public pages cache property details for 5 minutes.
await db.property.update({ where: { slug: SB }, data: { wifiSsid: "Bunks-Guest", wifiPassword: "mountain-air" } });

scenario("Public pages render cleanly");
for (const [label, viewport] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  for (const [name, path] of [["home", "/"], ["steamboat", `/property/${SB}`], ["summerland", `/property/${SL}`], ["about", "/?view=about"], ["mytrips", "/my-trips"], ["privacy", "/privacy"], ["wifi", `/connect/${SB}`], ["owners", "/owners"]]) {
    const page = await newPage(viewport);
    const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60_000 }).catch((e) => ({ status: () => `ERR ${e.message}` }));
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await shot(page, `${label}-${name}`);
    check(`UI-${label}-${name}`, `${label} ${path} loads with no errors`, res.status() === 200 && page.problems.length === 0, `${res.status()} ${page.problems.join(" | ")}`);
    if (label === "mobile") check(`UI-${label}-${name}-overflow`, `${path} has no horizontal scroll on a phone`, overflow <= 1, `${overflow}px wider than viewport`);
    await page.context().close();
  }
}

scenario("Guest books through the UI");
{
  const page = await newPage({ width: 1280, height: 900 });
  await page.goto(`${BASE}/property/${SB}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /check availability/i }).first().click();
  await page.waitForTimeout(800);
  const picker = page.locator("div.fixed.inset-0.z-50");
  const airbnbNight = picker.getByRole("button", { name: `${dayLabel(D("2026-10-11"))}, unavailable` }).first();
  check("UB1", "Airbnb-booked night (Oct 11) is shown as unavailable", await airbnbNight.count() > 0 && await airbnbNight.isDisabled(), "Oct 11 not marked unavailable");
  await picker.getByRole("button", { name: dayLabel(D("2026-10-05")), exact: true }).first().click();
  const tooShort = picker.getByRole("button", { name: new RegExp(`^${dayLabel(D("2026-10-07"))}, below`) }).first();
  check("UB2", "calendar blocks a 2-night checkout (3-night minimum)", await tooShort.count() > 0 && await tooShort.isDisabled(), "Oct 7 selectable as checkout");
  await picker.getByRole("button", { name: dayLabel(D("2026-10-09")), exact: true }).first().click();
  await page.waitForTimeout(800);
  await shot(page, "flow-1-dates-selected");
  const overlayText = await page.locator("body").innerText();
  check("UB3", "overlay shows 4 nights", /4 nights/i.test(overlayText), "no '4 nights' text");
  await page.getByRole("button", { name: /^save$/i }).click();
  await page.waitForTimeout(1200);
  const sidebar = await page.locator("body").innerText();
  check("UB4", "sidebar quote shows the $1,647 total", sidebar.includes("1,647"), "total not shown");
  await shot(page, "flow-2-quote");
  await page.getByRole("button", { name: /^reserve$/i }).first().click();
  await page.waitForTimeout(1500);
  await shot(page, "flow-3-checkout");
  await page.fill("#guest-first-name", "Ui");
  await page.fill("#guest-last-name", "Tester");
  await page.fill("#guest-email", "ui-tester@example.com");
  await page.getByRole("button", { name: /continue to payment/i }).first().click();
  await page.waitForTimeout(3000);
  await shot(page, "flow-4-payment-step");
  const booking = await db.booking.findFirst({ where: { guestEmail: "ui-tester@example.com" } });
  check("UB5", "checkout created a PENDING hold for Oct 5–9 at $1,647", booking?.status === "PENDING" && booking.checkInDate.toISOString().startsWith(D("2026-10-05")) && booking.checkOutDate.toISOString().startsWith(D("2026-10-09")) && booking.totalPriceCents === 164700, JSON.stringify(booking));
  check("UB6", "no errors during the booking flow", page.problems.length === 0, page.problems.join(" | "));

  // Second guest tries the same dates in the UI → friendly message.
  const other = await newPage({ width: 1280, height: 900 });
  await other.goto(`${BASE}/property/${SB}`, { waitUntil: "networkidle" });
  await other.getByRole("button", { name: /check availability/i }).first().click();
  await other.waitForTimeout(600);
  const otherPicker = other.locator("div.fixed.inset-0.z-50");
  await otherPicker.getByRole("button", { name: dayLabel(D("2026-10-05")), exact: true }).first().click();
  await otherPicker.getByRole("button", { name: dayLabel(D("2026-10-09")), exact: true }).first().click();
  await other.getByRole("button", { name: /^save$/i }).click();
  await other.waitForTimeout(800);
  await other.getByRole("button", { name: /^reserve$/i }).first().click();
  await other.waitForTimeout(1000);
  await other.fill("#guest-first-name", "Second");
  await other.fill("#guest-last-name", "Guest");
  await other.fill("#guest-email", "second@example.com");
  await other.getByRole("button", { name: /continue to payment/i }).first().click();
  await other.waitForTimeout(2500);
  const msg = await other.locator("body").innerText();
  await shot(other, "flow-5-dates-taken");
  check("UB7", "second guest sees 'those dates were just booked', not raw JSON", /just booked/i.test(msg) && !/DATES_UNAVAILABLE/.test(msg), msg.slice(0, 300));
  await other.context().close();

  // Pay (webhook) and view the trip page.
  await stripe(`/__test/succeed/${booking.stripePaymentIntentId}`);
  await page.goto(`${BASE}/my-trips/${booking.publicReference}/essential`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const refBox = page.getByLabel(/booking reference/i).first();
  if (await refBox.count()) {
    await refBox.fill(booking.publicReference);
    await page.getByLabel(/email used on booking/i).first().fill("ui-tester@example.com");
    await page.getByRole("button", { name: /view booking/i }).first().click();
    await page.waitForTimeout(2000);
  }
  const trip = await page.locator("body").innerText();
  await shot(page, "flow-6-trip-page");
  const md = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).split(" ");
  const dayRe = ([mon, day]) => new RegExp(`${mon}[a-z]*\\s+${day}\\b`);
  check("UB8", "trip page shows the booked check-in and checkout dates", dayRe(md(D("2026-10-05"))).test(trip) && dayRe(md(D("2026-10-09"))).test(trip), trip.slice(0, 400));
  check("UB9", "trip page has no errors", page.problems.length === 0, page.problems.join(" | "));
  const wifiLine = trip.match(/Wi-Fi\s*\n\s*([^\n]+)/)?.[1] ?? "";
  check("UB10", "paid trip page shows the address and Wi-Fi (kept off public pages)", /6th Street/.test(trip) && wifiLine.includes(" / "), `wifi: ${wifiLine}`, "T-SEC-10");
  const pdfLink = await page.locator('a[href^="/api/guides/"]').count();
  check("UB11", "paid trip page links the signed guide PDF", pdfLink > 0, "no /api/guides/ link", "T-SEC-11");
  await page.context().close();
}

scenario("Phone booking flow (Summerland)");
{
  await forceSync(SL);
  const page = await newPage({ width: 390, height: 844 });
  await page.goto(`${BASE}/property/${SL}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /check availability/i }).last().click();
  await page.waitForTimeout(600);
  const picker = page.locator("div.fixed.inset-0.z-50");
  const airbnb = picker.getByRole("button", { name: `${dayLabel(D("2026-10-21"))}, unavailable` }).first();
  check("PH1", "phone: Summerland's Airbnb night Oct 21 shows unavailable", await airbnb.count() > 0, "not marked");
  await picker.getByRole("button", { name: dayLabel(D("2026-10-12")), exact: true }).first().click();
  await picker.getByRole("button", { name: dayLabel(D("2026-10-15")), exact: true }).first().click();
  await shot(page, "phone-1-dates");
  await page.getByRole("button", { name: /^save$/i }).click();
  await page.waitForTimeout(800);
  await shot(page, "phone-2-after-save");
  await page.getByRole("button", { name: /^reserve$/i }).last().click();
  await page.waitForTimeout(1200);
  await page.fill("#guest-first-name", "Phone");
  await page.fill("#guest-last-name", "Guest");
  await page.fill("#guest-email", "phone@example.com");
  await shot(page, "phone-3-details");
  await page.getByRole("button", { name: /continue to payment/i }).first().click();
  await page.waitForTimeout(2500);
  await shot(page, "phone-4-payment");
  const b = await db.booking.findFirst({ where: { guestEmail: "phone@example.com" } });
  check("PH2", "phone checkout creates the Oct 12–15 hold", b?.checkInDate.toISOString().startsWith(D("2026-10-12")) && b?.checkOutDate.toISOString().startsWith(D("2026-10-15")), JSON.stringify(b));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("PH3", "phone checkout has no horizontal scroll", overflow <= 1, `${overflow}px`);
  check("PH4", "no errors in the phone flow", page.problems.length === 0, page.problems.join(" | "));
  await page.context().close();
}

scenario("Guests in other timezones book the right dates");
for (const tz of ["Asia/Tokyo", "Pacific/Honolulu", "Europe/London"]) {
  await resetData();
  await forceSync(SB);
  const page = await newPage({ width: 1280, height: 900 }, tz);
  await page.goto(`${BASE}/property/${SB}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /check availability/i }).first().click();
  await page.waitForTimeout(600);
  const picker = page.locator("div.fixed.inset-0.z-50");
  await picker.getByRole("button", { name: dayLabel(D("2026-11-09")), exact: true }).first().click();
  await picker.getByRole("button", { name: dayLabel(D("2026-11-12")), exact: true }).first().click();
  await page.getByRole("button", { name: /^save$/i }).click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /^reserve$/i }).first().click();
  await page.waitForTimeout(1000);
  await page.fill("#guest-first-name", "Far");
  await page.fill("#guest-last-name", "Away");
  await page.fill("#guest-email", `tz-${tz.replace(/\W/g, "")}@example.com`.toLowerCase());
  await page.getByRole("button", { name: /continue to payment/i }).first().click();
  await page.waitForTimeout(2500);
  const b = await db.booking.findFirst({ where: { guestEmail: `tz-${tz.replace(/\W/g, "")}@example.com`.toLowerCase() } });
  check(`TZ-${tz}`, `guest browsing from ${tz} books Nov 9–12 exactly`, b && b.checkInDate.toISOString().startsWith(D("2026-11-09")) && b.checkOutDate.toISOString().startsWith(D("2026-11-12")), JSON.stringify(b && [b.checkInDate, b.checkOutDate]));
  await page.context().close();
}

scenario("Wi-Fi page and My Trips edge cases");
{
  const page = await newPage({ width: 390, height: 844 });
  await page.goto(`${BASE}/connect/${SB}`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "wifi-ui@example.com");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(1500);
  const text = await page.locator("body").innerText();
  await shot(page, "wifi-after-submit");
  const lead = await db.guestLead.findFirst({ where: { email: "wifi-ui@example.com" } });
  check("WF1", "Wi-Fi page shows the network + password saved in Admin → Setup", /mountain-air/.test(text) && /Bunks-Guest/.test(text), text.slice(0, 300), "T-UI-03");
  check("WF2", "the email is captured as a guest lead for Steamboat", lead?.propertySlug === SB, JSON.stringify(lead));

  const trips = await newPage({ width: 390, height: 844 });
  await trips.goto(`${BASE}/my-trips`, { waitUntil: "networkidle" });
  await trips.getByLabel(/booking reference/i).first().fill("ZZZZZ");
  await trips.getByLabel(/email used on booking/i).first().fill("nobody@example.com");
  await trips.getByRole("button", { name: /view booking/i }).first().click();
  await trips.waitForTimeout(1500);
  const tripText = await trips.locator("body").innerText();
  await shot(trips, "mytrips-not-found");
  check("MT1", "unknown booking shows a friendly not-found message", /couldn.t find|not found|check the reference/i.test(tripText) && !/Internal|undefined|\{"/.test(tripText), tripText.slice(0, 300));
  // The 404 and the app's own "couldn't find that booking" log line are expected here.
  const unexpected = trips.problems.filter((p) => !/404|couldn't find that booking/.test(p));
  check("MT2", "no unexpected errors on a failed lookup", unexpected.length === 0, unexpected.join(" | "));
  await page.context().close();
  await trips.context().close();
}

scenario("Owners page request form");
{
  const page = await newPage({ width: 390, height: 844 });
  await page.goto(`${BASE}/owners`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /request your free home hub/i }).first().click();
  await page.fill("#owner-name", "Sam Owner");
  await page.fill("#owner-email", "sam@example.com");
  await page.fill("#owner-location", "Steamboat Springs, CO");
  await page.getByRole("button", { name: /request my free home hub/i }).click();
  await page.waitForTimeout(1500);
  const text = await page.locator("body").innerText();
  await shot(page, "owners-form-sent");
  check("OWUI1", "owner form submits and shows a thank-you", /we.ve got it/i.test(text) && page.problems.length === 0, `${text.slice(0, 200)} ${page.problems.join(" | ")}`);
  await page.context().close();
}

scenario("Admin pages");
{
  const page = await newPage({ width: 1280, height: 900 });
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', ADMIN.email);
  await page.fill('input[type="password"]', ADMIN.password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(2000);
  for (const section of ["details", "pricing", "setup", "messages", "emails", "marketing"]) {
    page.problems = [];
    const res = await page.goto(`${BASE}/admin/${section}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const text = await page.locator("body").innerText();
    await shot(page, `admin-${section}`);
    check(`UA-${section}`, `admin/${section} loads signed-in with no errors`, res.status() === 200 && page.problems.length === 0 && !/sign in to continue|password/i.test(text.slice(0, 400)), `${res.status()} ${page.problems.join(" | ")} ${text.slice(0, 120)}`);
  }

  // Cancel a paid booking from Admin → Bookings with the policy-suggested refund.
  const paid = await book({ guestEmail: "cancel-ui@example.com", checkIn: D("2026-12-07"), checkOut: D("2026-12-10") });
  await pay(paid);
  page.problems = [];
  await page.goto(`${BASE}/admin/messages`, { waitUntil: "networkidle" });
  // The bookings table lists guest name and reference (redesigned in PR #28); open the row by reference.
  await page.getByText(paid.json.bookingReference).first().click();
  await page.getByRole("button", { name: /cancel booking/i }).first().click();
  await page.waitForTimeout(300);
  const suggested = await page.locator("label", { hasText: "(your policy)" }).innerText();
  check("UA-cancel-1", "policy suggests a full refund for a stay 70 days out", /Full refund/.test(suggested), suggested);
  await shot(page, "admin-cancel-open");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /cancel and refund/i }).click();
  await page.waitForTimeout(2000);
  await shot(page, "admin-cancel-done");
  const row = await db.booking.findUnique({ where: { id: paid.json.bookingId } });
  const st = await stripe("/__test/state");
  check("UA-cancel-2", "admin cancel marks the booking CANCELLED and refunds in full", row.status === "CANCELLED" && st.refunds.some((r) => r.payment_intent === row.stripePaymentIntentId && r.amount === row.totalPriceCents), `${row.status} ${JSON.stringify(st.refunds)}`);
  check("UA-cancel-3", "admin page shows Cancelled after refresh, no errors", /Cancelled/.test(await page.locator("body").innerText()) && page.problems.length === 0, page.problems.join(" | "));
  await page.context().close();
}

await browser.close();
await db.property.update({ where: { slug: SB }, data: { wifiSsid: null, wifiPassword: null } });
await resetData();
const pass = results.filter((r) => r.pass).length;
console.log(`\n${pass}/${results.length} UI checks passed`);
fs.mkdirSync(new URL("../results/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL(`../results/ui-${process.env.QA_RUN_LABEL || "latest"}.json`, import.meta.url), JSON.stringify({ at: new Date().toISOString(), pass, total: results.length, results }, null, 2));
await db.$disconnect();
