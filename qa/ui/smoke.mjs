// Browser smoke test of the guest journey and admin, against the local QA stack.
// Usage: PLAYWRIGHT_MODULE=/path/to/node_modules/playwright/index.mjs SHOTS=/tmp/shots node qa/ui/smoke.mjs
import fs from "node:fs";
import { BASE, SB, SL, db, resetData, forceSync, stripe, check, results, scenario, ADMIN } from "../e2e/lib.mjs";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const SHOTS = process.env.SHOTS || "/tmp/bunks-qa/shots";
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
// External hosts (Stripe.js, fonts, map tiles, images) are unreachable in the sandbox; ignore their failures.
const IGNORED = /Failed to load Stripe\.js|js\.stripe\.com|m\.stripe|fonts\.(googleapis|gstatic)|unsplash|googletagmanager|vercel-insights|_vercel|open-meteo|images\.|api\.mapbox/;

async function newPage(viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, timezoneId: "America/Denver" });
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

scenario("Public pages render cleanly");
for (const [label, viewport] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  for (const [name, path] of [["home", "/"], ["steamboat", `/property/${SB}`], ["summerland", `/property/${SL}`], ["about", "/?view=about"], ["mytrips", "/my-trips"], ["privacy", "/privacy"], ["wifi", `/connect/${SB}`]]) {
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
  const airbnbNight = picker.getByRole("button", { name: `${dayLabel("2026-10-11")}, unavailable` }).first();
  check("UB1", "Airbnb-booked night (Oct 11) is shown as unavailable", await airbnbNight.count() > 0 && await airbnbNight.isDisabled(), "Oct 11 not marked unavailable");
  await picker.getByRole("button", { name: dayLabel("2026-10-05"), exact: true }).first().click();
  const tooShort = picker.getByRole("button", { name: new RegExp(`^${dayLabel("2026-10-07")}, below`) }).first();
  check("UB2", "calendar blocks a 2-night checkout (3-night minimum)", await tooShort.count() > 0 && await tooShort.isDisabled(), "Oct 7 selectable as checkout");
  await picker.getByRole("button", { name: dayLabel("2026-10-09"), exact: true }).first().click();
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
  check("UB5", "checkout created a PENDING hold for Oct 5–9 at $1,647", booking?.status === "PENDING" && booking.checkInDate.toISOString().startsWith("2026-10-05") && booking.checkOutDate.toISOString().startsWith("2026-10-09") && booking.totalPriceCents === 164700, JSON.stringify(booking));
  check("UB6", "no errors during the booking flow", page.problems.length === 0, page.problems.join(" | "));

  // Second guest tries the same dates in the UI → friendly message.
  const other = await newPage({ width: 1280, height: 900 });
  await other.goto(`${BASE}/property/${SB}`, { waitUntil: "networkidle" });
  await other.getByRole("button", { name: /check availability/i }).first().click();
  await other.waitForTimeout(600);
  const otherPicker = other.locator("div.fixed.inset-0.z-50");
  await otherPicker.getByRole("button", { name: dayLabel("2026-10-05"), exact: true }).first().click();
  await otherPicker.getByRole("button", { name: dayLabel("2026-10-09"), exact: true }).first().click();
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
  check("UB8", "trip page shows Oct 5 check-in and Oct 9 checkout", /Oct(ober)?\s+5/.test(trip) && /Oct(ober)?\s+9/.test(trip), trip.slice(0, 400));
  check("UB9", "trip page has no errors", page.problems.length === 0, page.problems.join(" | "));
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
  await page.context().close();
}

await browser.close();
await resetData();
const pass = results.filter((r) => r.pass).length;
console.log(`\n${pass}/${results.length} UI checks passed`);
fs.mkdirSync(new URL("../results/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL(`../results/ui-${process.env.QA_RUN_LABEL || "latest"}.json`, import.meta.url), JSON.stringify({ at: new Date().toISOString(), pass, total: results.length, results }, null, 2));
await db.$disconnect();
