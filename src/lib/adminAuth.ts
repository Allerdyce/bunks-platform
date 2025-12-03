import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";

const DEFAULT_ADMIN_EMAILS = ["ali@bunks.com", "matt@bunks.com"];
const parseAdminEmails = () => {
  const configured = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAILS.join(",");
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
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "PMbunks101!";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? "bunks-dev-secret";

export const ADMIN_SESSION_COOKIE = "bunks_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

type SessionPayload = {
  email: string;
  exp: number;
};

const encodePayload = (payload: SessionPayload) => Buffer.from(JSON.stringify(payload)).toString("base64url");

const signPayload = (encodedPayload: string) =>
  crypto.createHmac("sha256", SESSION_SECRET).update(encodedPayload).digest("base64url");

export const createSessionToken = (email: string) => {
  const payload: SessionPayload = {
    email,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encodedPayload = encodePayload(payload);
  const signature = signPayload(encodedPayload);
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
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expectedSignature = signPayload(encodedPayload);
  if (signature.length !== expectedSignature.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }
  const payload = decodePayload(encodedPayload);
  if (!payload || payload.exp < Date.now()) {
    return null;
  }
  return payload;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isValidAdminCredentials = (email: string, password: string) =>
  ADMIN_EMAILS.includes(normalizeEmail(email)) && password === ADMIN_PASSWORD;

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
