import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, email: session.email });
}
