import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/adminAuth";
import { getOpsDetails, parseOpsDetailsPayload, upsertOpsDetails } from "@/lib/opsDetails";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = withAdminAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const details = await getOpsDetails();
  return NextResponse.json({ details });
}

export async function PUT(request: NextRequest) {
  const session = withAdminAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const parsed = parseOpsDetailsPayload(payload);
    const details = await upsertOpsDetails(parsed);
    return NextResponse.json({ details });
  } catch (error) {
    return NextResponse.json({ error: (error as Error)?.message ?? "Failed to update ops details" }, { status: 400 });
  }
}
