import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";

const DEFAULT_ADMIN_EMAILS = [
  "ali@bunks.com",
  "matt@bunks.com",
  "trumandavies7@gmail.com",
  "alissa@bunks.com"
];
const parseAdminEmails = () => {
  const envEmails = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL;
  const configured = envEmails
    ? `${envEmails},${DEFAULT_ADMIN_EMAILS.join(",")}`
    : DEFAULT_ADMIN_EMAILS.join(",");

  return Array.from(
    new Set(
      configured
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
  );
};

const ADMIN_EMAILS = parseAdminEmails();
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const MIN_PRODUCTION_SECRET_LENGTH = 32;

// Dev-only fallbacks. In production there is no fallback: login and session
// verification fail closed until ADMIN_PASSWORD and ADMIN_SESSION_SECRET are set.
const DEV_ADMIN_PASSWORD = "bunks-dev-password";
const DEV_SESSION_SECRET = "bunks-dev-secret";

const getAdminPassword = (): string | null => {
  const password = process.env.ADMIN_PASSWORD;
  if (password) return password;
  return IS_PRODUCTION ? null : DEV_ADMIN_PASSWORD;
};

/**
 * Returns the admin session secret, or null when it is missing/too weak in production.
 * Also used by cleanerAuth to derive a distinct cleaner key.
 */
export const getAdminSessionSecret = (): string | null => {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (IS_PRODUCTION) {
    if (!secret || secret.length < MIN_PRODUCTION_SECRET_LENGTH) return null;
    return secret;
  }
  return secret || DEV_SESSION_SECRET;
};

/** True when admin auth has everything it needs to issue and verify sessions. */
export const isAdminAuthConfigured = () => Boolean(getAdminPassword() && getAdminSessionSecret());

export const logAdminAuthConfigError = () => {
  if (!getAdminPassword()) {
    console.error("[adminAuth] ADMIN_PASSWORD is not set; admin login is disabled.");
  }
  if (!getAdminSessionSecret()) {
    console.error(
      `[adminAuth] ADMIN_SESSION_SECRET is missing or shorter than ${MIN_PRODUCTION_SECRET_LENGTH} characters; admin login is disabled.`
    );
  }
};

export const ADMIN_SESSION_COOKIE = "bunks_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

type SessionPayload = {
  email: string;
  role: "admin";
  exp: number;
};

const encodePayload = (payload: SessionPayload) => Buffer.from(JSON.stringify(payload)).toString("base64url");

const signPayload = (encodedPayload: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");

export const createSessionToken = (email: string) => {
  const secret = getAdminSessionSecret();
  if (!secret) {
    throw new Error("Admin session secret is not configured");
  }
  const payload: SessionPayload = {
    email: normalizeEmail(email),
    role: "admin",
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encodedPayload = encodePayload(payload);
  const signature = signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
};

const decodePayload = (encoded: string): SessionPayload | null => {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    return JSON.parse(json) as SessionPayload;
  } catch (error) {
    console.error("Failed to decode admin session payload", error);
    return null;
  }
};

export const verifySessionToken = (token?: string | null): SessionPayload | null => {
  if (!token) return null;
  const secret = getAdminSessionSecret();
  if (!secret) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expectedSignature = signPayload(encodedPayload, secret);
  if (signature.length !== expectedSignature.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }
  const payload = decodePayload(encodedPayload);
  if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now()) {
    return null;
  }
  if (payload.role !== "admin" || typeof payload.email !== "string") {
    return null;
  }
  if (!ADMIN_EMAILS.includes(normalizeEmail(payload.email))) {
    return null;
  }
  return payload;
};

const sha256 = (value: string) => crypto.createHash("sha256").update(value, "utf8").digest();

const safeEqualStrings = (a: string, b: string) => crypto.timingSafeEqual(sha256(a), sha256(b));

export const isValidAdminCredentials = (email: string, password: string) => {
  const expectedPassword = getAdminPassword();
  if (!expectedPassword || !getAdminSessionSecret()) return false;
  const passwordOk = safeEqualStrings(password, expectedPassword);
  return ADMIN_EMAILS.includes(normalizeEmail(email)) && passwordOk;
};

export const readSessionFromRequest = (request: NextRequest) =>
  verifySessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

export const withAdminAuth = (request: NextRequest) => {
  const session = readSessionFromRequest(request);
  if (!session) {
    return null;
  }
  return session;
};

export const setSessionCookie = (response: NextResponse, token: string) => {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
};

export const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });
};
