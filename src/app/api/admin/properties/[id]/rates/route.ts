import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionFromRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";

const toCents = (value: number) => Math.round(value * 100);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const propertyId = Number(id);
  if (Number.isNaN(propertyId)) {
    return NextResponse.json({ error: "Invalid property id" }, { status: 400 });
  }

  const { weekdayRate, weekendRate, cleaningFee, serviceFee } = (await request.json().catch(() => ({}))) as {
    weekdayRate?: number;
    weekendRate?: number;
    cleaningFee?: number;
    serviceFee?: number;
  };

  if (
    typeof weekdayRate !== "number" ||
    typeof weekendRate !== "number" ||
    typeof cleaningFee !== "number" ||
    typeof serviceFee !== "number"
  ) {
    return NextResponse.json({ error: "All pricing fields are required" }, { status: 400 });
  }

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: {
      weekdayRate: toCents(weekdayRate),
      weekendRate: toCents(weekendRate),
      cleaningFee: toCents(cleaningFee),
      serviceFee: toCents(serviceFee),
    } as any,
  });

  return NextResponse.json({
    ok: true,
    property: {
      id: updated.id,
      weekdayRate: (updated as any).weekdayRate,
      weekendRate: (updated as any).weekendRate,
      cleaningFee: (updated as any).cleaningFee,
      serviceFee: (updated as any).serviceFee,
    },
  });
}
