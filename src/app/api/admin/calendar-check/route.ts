import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/adminAuth";
import { inspectCalendars } from "@/lib/icalSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin → Setup "Check calendars": each linked calendar's upcoming stays next to the nights
// Bunks currently blocks, so the owner can compare with Airbnb/Vrbo by eye.
export async function GET(request: NextRequest) {
  if (!withAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  const property = await prisma.property.findUnique({
    where: { slug },
    select: { id: true, slug: true, airbnbIcalUrl: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const today = new Date();
  const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const [feeds, blocks, bookings] = await Promise.all([
    inspectCalendars(property),
    prisma.blockedDate.findMany({
      where: { propertyId: property.id, date: { gte: from } },
      select: { date: true, source: true },
      orderBy: { date: "asc" },
    }),
    prisma.booking.findMany({
      where: { propertyId: property.id, status: "PAID", checkOutDate: { gt: from } },
      select: { checkInDate: true, checkOutDate: true, publicReference: true },
      orderBy: { checkInDate: "asc" },
    }),
  ]);

  return NextResponse.json({
    feeds,
    blockedNights: {
      airbnbAndOther: blocks.filter((b) => b.source === "AIRBNB").map((b) => b.date.toISOString().slice(0, 10)),
      direct: blocks.filter((b) => b.source === "DIRECT").map((b) => b.date.toISOString().slice(0, 10)),
    },
    directBookings: bookings.map((b) => ({
      start: b.checkInDate.toISOString().slice(0, 10),
      end: b.checkOutDate.toISOString().slice(0, 10),
      reference: b.publicReference,
    })),
  });
}
