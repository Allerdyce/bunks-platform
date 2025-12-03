import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/adminAuth";
import { specialRateClient } from "@/lib/specialRateClient";

export const runtime = "nodejs";

const toCents = (value: number) => Math.round(value * 100);
const normalizeDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

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

  const { startDate, date, endDate, price, note, isBlocked } = (await request.json().catch(() => ({}))) as {
    startDate?: string;
    date?: string; // legacy support
    endDate?: string;
    price?: number;
    note?: string;
    isBlocked?: boolean;
  };

  const effectiveStartDate = startDate ?? date;
  if (!effectiveStartDate) {
    return NextResponse.json({ error: "Start date is required" }, { status: 400 });
  }

  const normalizedStart = normalizeDate(effectiveStartDate);
  const normalizedEnd = endDate ? normalizeDate(endDate) : normalizedStart;

  if (!normalizedStart || !normalizedEnd) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  if (normalizedEnd.getTime() < normalizedStart.getTime()) {
    return NextResponse.json({ error: "End date cannot be before start date" }, { status: 400 });
  }

  if (!isBlocked && (typeof price !== "number" || price <= 0)) {
    return NextResponse.json({ error: "Price must be provided for special rates" }, { status: 400 });
  }

  const targetDates: Date[] = [];
  const cursor = new Date(normalizedStart);
  while (cursor.getTime() <= normalizedEnd.getTime()) {
    targetDates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const records = await Promise.all(
    targetDates.map((targetDate) =>
      specialRateClient.upsert({
        where: {
          propertyId_date: {
            propertyId,
            date: targetDate,
          },
        },
        update: {
          price: isBlocked ? 0 : toCents(price ?? 0),
          note,
          isBlocked: Boolean(isBlocked),
        },
        create: {
          propertyId,
          date: targetDate,
          price: isBlocked ? 0 : toCents(price ?? 0),
          note,
          isBlocked: Boolean(isBlocked),
        },
      }),
    ),
  );

  const normalizedRecords = records.map((entry) => ({
    id: entry.id,
    date: entry.date.toISOString().split("T")[0],
    price: entry.price,
    note: entry.note,
    isBlocked: entry.isBlocked,
  }));

  return NextResponse.json({
    ok: true,
    specialRates: normalizedRecords,
    specialRate: normalizedRecords[normalizedRecords.length - 1],
  });
}
