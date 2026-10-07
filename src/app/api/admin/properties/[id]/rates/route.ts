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
  if (![weekdayRate, weekendRate, cleaningFee, serviceFee].every((value) => Number.isFinite(value) && value >= 0 && value <= 100_000)) {
    return NextResponse.json({ error: "Prices must be between $0 and $100,000" }, { status: 400 });
  }

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: {
      weekdayRate: toCents(weekdayRate),
      weekendRate: toCents(weekendRate),
      cleaningFee: toCents(cleaningFee),
      serviceFee: toCents(serviceFee),
    },
  });

  return NextResponse.json({
    ok: true,
    property: {
      id: updated.id,
      weekdayRate: updated.weekdayRate,
      weekendRate: updated.weekendRate,
      cleaningFee: updated.cleaningFee,
      serviceFee: updated.serviceFee,
    },
  });
}
