import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import { getAdminSessionSecret } from "@/lib/adminAuth";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const MIN_PRODUCTION_SECRET_LENGTH = 32;

// Dev-only defaults. In production CLEANER_EMAILS and CLEANER_PASSWORD must be set.
const DEV_CLEANER_EMAILS = ["cleaner@bunks.com"];
const DEV_CLEANER_PASSWORD = "bunks-dev-cleaner";
const DEV_SESSION_SECRET = "bunks-cleaner-secret";

const parseCleanerEmails = () => {
    const configured = process.env.CLEANER_EMAILS ?? (IS_PRODUCTION ? "" : DEV_CLEANER_EMAILS.join(","));
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

const getCleanerPassword = (): string | null => {
    const password = process.env.CLEANER_PASSWORD;
    if (password) return password;
    return IS_PRODUCTION ? null : DEV_CLEANER_PASSWORD;
};

/**
 * CLEANER_SESSION_SECRET if set; otherwise a key derived from the admin secret so that
 * admin and cleaner tokens are never signed with the same key.
 */
const getCleanerSessionSecret = (): string | null => {
    const explicit = process.env.CLEANER_SESSION_SECRET;
    if (explicit) {
        if (IS_PRODUCTION && explicit.length < MIN_PRODUCTION_SECRET_LENGTH) return null;
        return explicit;
    }
    const adminSecret = getAdminSessionSecret();
    if (adminSecret) {
        return crypto.createHmac("sha256", adminSecret).update("bunks-cleaner-session").digest("base64url");
    }
    return IS_PRODUCTION ? null : DEV_SESSION_SECRET;
};

export const isCleanerAuthConfigured = () =>
    CLEANER_EMAILS.length > 0 && Boolean(getCleanerPassword() && getCleanerSessionSecret());

export const logCleanerAuthConfigError = () => {
    if (CLEANER_EMAILS.length === 0) {
        console.error("[cleanerAuth] CLEANER_EMAILS is not set; cleaner login is disabled.");
    }
    if (!getCleanerPassword()) {
        console.error("[cleanerAuth] CLEANER_PASSWORD is not set; cleaner login is disabled.");
    }
    if (!getCleanerSessionSecret()) {
        console.error(
            "[cleanerAuth] CLEANER_SESSION_SECRET (or ADMIN_SESSION_SECRET) is missing or too short; cleaner login is disabled."
        );
    }
};

export const CLEANER_SESSION_COOKIE = "bunks_cleaner_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days (longer for mobile convenience)

type SessionPayload = {
    email: string;
    role: "cleaner";
    exp: number;
};

const encodePayload = (payload: SessionPayload) => Buffer.from(JSON.stringify(payload)).toString("base64url");

const signPayload = (encodedPayload: string, secret: string) =>
    crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");

export const createCleanerSessionToken = (email: string) => {
    const secret = getCleanerSessionSecret();
    if (!secret) {
        throw new Error("Cleaner session secret is not configured");
    }
    const payload: SessionPayload = {
        email,
        role: "cleaner",
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
        console.error("Failed to decode cleaner session payload", error);
        return null;
    }
};

export const verifyCleanerSessionToken = (token?: string | null): SessionPayload | null => {
    if (!token) return null;
    const secret = getCleanerSessionSecret();
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
    if (payload.role !== "cleaner" || typeof payload.email !== "string") {
        return null;
    }
    if (!CLEANER_EMAILS.includes(normalizeEmail(payload.email))) {
        return null;
    }
    return payload;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const sha256 = (value: string) => crypto.createHash("sha256").update(value, "utf8").digest();

export const isValidCleanerCredentials = (email: string, password: string) => {
    const expectedPassword = getCleanerPassword();
    if (!expectedPassword || !getCleanerSessionSecret()) return false;
    const passwordOk = crypto.timingSafeEqual(sha256(password), sha256(expectedPassword));
    return CLEANER_EMAILS.includes(normalizeEmail(email)) && passwordOk;
};

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
