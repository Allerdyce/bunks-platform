import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";

const DEFAULT_CLEANER_EMAILS = ["cleaner@bunks.com"];
const parseCleanerEmails = () => {
    const configured = process.env.CLEANER_EMAILS ?? DEFAULT_CLEANER_EMAILS.join(",");
    return Array.from(
        new Set(
            configured
                .split(",")
                .map((email) => email.trim().toLowerCase())
                .filter(Boolean)
        )
    );
};

const CLEANER_EMAILS = parseCleanerEmails();
const CLEANER_PASSWORD = process.env.CLEANER_PASSWORD ?? "CleanerBunks1!";
const SESSION_SECRET = process.env.CLEANER_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET ?? "bunks-cleaner-secret";

export const CLEANER_SESSION_COOKIE = "bunks_cleaner_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days (longer for mobile convenience)

type SessionPayload = {
    email: string;
    role: "CLEANER";
    exp: number;
};

const encodePayload = (payload: SessionPayload) => Buffer.from(JSON.stringify(payload)).toString("base64url");

const signPayload = (encodedPayload: string) =>
    crypto.createHmac("sha256", SESSION_SECRET).update(encodedPayload).digest("base64url");

export const createCleanerSessionToken = (email: string) => {
    const payload: SessionPayload = {
        email,
        role: "CLEANER",
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
        console.error("Failed to decode cleaner session payload", error);
        return null;
    }
};

export const verifyCleanerSessionToken = (token?: string | null): SessionPayload | null => {
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

export const isValidCleanerCredentials = (email: string, password: string) =>
    CLEANER_EMAILS.includes(normalizeEmail(email)) && password === CLEANER_PASSWORD;

export const readCleanerSessionFromRequest = (request: NextRequest) =>
    verifyCleanerSessionToken(request.cookies.get(CLEANER_SESSION_COOKIE)?.value);

export const withCleanerAuth = (request: NextRequest) => {
    const session = readCleanerSessionFromRequest(request);
    if (!session) {
        return null;
    }
    return session;
};

export const setCleanerSessionCookie = (response: NextResponse, token: string) => {
    response.cookies.set(CLEANER_SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_TTL_MS / 1000,
        path: "/",
    });
};

export const clearCleanerSessionCookie = (response: NextResponse) => {
    response.cookies.set(CLEANER_SESSION_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0),
        path: "/",
    });
};
