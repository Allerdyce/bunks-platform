// Shared helpers for the local QA scenarios. Requires qa/harness/start.sh to be running.
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

export const BASE = process.env.QA_BASE_URL || "http://localhost:3000";
export const STRIPE = process.env.QA_STRIPE_URL || "http://localhost:12111";
export const EMAIL_DIR = process.env.EMAIL_CAPTURE_DIR || "/tmp/bunks-qa/emails";
export const ICAL_DIR = process.env.QA_ICAL_DIR || "/tmp/bunks-qa/ical";
export const CRON_SECRET = process.env.CRON_SECRET || "qa-cron-secret";
export const ADMIN = { email: "ali@bunks.com", password: process.env.ADMIN_PASSWORD || "qa-admin-password" };
export const SB = "steamboat-downtown-townhome";
export const SL = "summerland-ocean-view-beach-bungalow";

const dbUrl = process.env.DATABASE_URL || "postgresql://bunks:bunks@localhost:5432/bunks_qa";
if (!/localhost|127\.0\.0\.1/.test(dbUrl)) throw new Error("QA scenarios only run against a local database");
export const db = new PrismaClient({ datasources: { db: { url: dbUrl } } });

export async function api(p, { method = "GET", body, headers = {}, raw = false } = {}) {
  const res = await fetch(BASE + p, {
    method,
    headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text, headers: res.headers, raw: raw ? res : undefined };
}

export async function stripe(p, body) {
  const res = await fetch(STRIPE + p, { method: body === undefined && p.endsWith("state") ? "GET" : "POST", body: body ? JSON.stringify(body) : undefined });
  return res.json();
}

export async function resetData() {
  await db.message.deleteMany({});
  await db.conversation.deleteMany({});
  await db.emailLog.deleteMany({});
  await db.blockedDate.deleteMany({});
  await db.specialRate.deleteMany({});
  await db.booking.deleteMany({});
  // Airbnb pricing off by default; its own scenario switches it on.
  await db.featureToggle.upsert({ where: { key: "airbnbPricing" }, update: { enabled: false }, create: { key: "airbnbPricing", enabled: false } });
  clearEmails();
  restoreIcal();
}

export function clearEmails() {
  fs.mkdirSync(EMAIL_DIR, { recursive: true });
  for (const f of fs.readdirSync(EMAIL_DIR)) fs.unlinkSync(path.join(EMAIL_DIR, f));
}

export function emails() {
  if (!fs.existsSync(EMAIL_DIR)) return [];
  return fs.readdirSync(EMAIL_DIR).sort().map((f) => JSON.parse(fs.readFileSync(path.join(EMAIL_DIR, f), "utf8")));
}

const FIXTURES = new URL("../fixtures/ical/", import.meta.url).pathname;
export function restoreIcal() {
  fs.mkdirSync(ICAL_DIR, { recursive: true });
  for (const f of fs.readdirSync(FIXTURES)) fs.copyFileSync(path.join(FIXTURES, f), path.join(ICAL_DIR, f));
}
export function writeIcal(name, content) { fs.writeFileSync(path.join(ICAL_DIR, name), content); }
export function removeIcal(name) { fs.rmSync(path.join(ICAL_DIR, name), { force: true }); }

export async function adminCookie() {
  const res = await fetch(BASE + "/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(ADMIN) });
  const cookie = res.headers.get("set-cookie");
  if (!cookie) throw new Error(`admin login failed: ${res.status}`);
  return cookie.split(";")[0];
}

export async function forceSync(slug) {
  return api(`/api/properties/${slug}/sync-ical`, { method: "POST", headers: { authorization: `Bearer ${CRON_SECRET}` } });
}

export async function book(overrides = {}) {
  return api("/api/bookings", {
    method: "POST",
    body: { propertySlug: SB, checkIn: "2026-10-05", checkOut: "2026-10-09", guestName: "QA Guest", guestEmail: "guest1@example.com", guests: 2, ...overrides },
  });
}

export async function pay(bookingResponse) {
  const pi = bookingResponse.json.clientSecret.split("_secret")[0];
  return { pi, webhook: await stripe(`/__test/succeed/${pi}`) };
}

export async function expireHold(bookingId) {
  await db.booking.update({ where: { id: bookingId }, data: { createdAt: new Date(Date.now() - 31 * 60_000) } });
}

// --- tiny test runner ---
export const results = [];
let current = "";
export function scenario(name) { current = name; }
export function check(id, description, pass, detail = "", ticket = "") {
  results.push({ scenario: current, id, description, pass: Boolean(pass), detail: pass ? "" : String(detail).slice(0, 400), ticket });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`${mark}  ${id}  ${description}${ticket ? `  [${ticket}]` : ""}${pass ? "" : `\n      → ${String(detail).slice(0, 300)}`}`);
}
