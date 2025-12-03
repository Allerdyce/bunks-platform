import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, isValidAdminCredentials, setSessionCookie } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
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
