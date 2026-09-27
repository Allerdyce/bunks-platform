import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import {
  createSessionToken,
  isAdminAuthConfigured,
  isValidAdminCredentials,
  logAdminAuthConfigError,
  setSessionCookie,
} from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req, "admin-login", 10, 15 * 60_000);
  if (limited) return limited;

  if (!isAdminAuthConfigured()) {
    logAdminAuthConfigError();
    return NextResponse.json({ error: "Admin login is not configured" }, { status: 503 });
  }

  const { email, password } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (!isValidAdminCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createSessionToken(email);
  const response = NextResponse.json({ ok: true, email });
  setSessionCookie(response, token);
  return response;
}
