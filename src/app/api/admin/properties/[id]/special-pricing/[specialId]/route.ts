import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/adminAuth";
import { specialRateClient } from "@/lib/specialRateClient";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; specialId: string }> },
) {
  const { id, specialId: specialIdParam } = await params;
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const propertyId = Number(id);
  if (Number.isNaN(propertyId)) {
    return NextResponse.json({ error: "Invalid property id" }, { status: 400 });
  }

  const specialId = Number(specialIdParam);
  if (Number.isNaN(specialId)) {
    return NextResponse.json({ error: "Invalid special rate id" }, { status: 400 });
  }

  const result = await specialRateClient.deleteMany({
    where: { id: specialId, propertyId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Special rate not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
