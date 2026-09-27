import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/adminAuth";
import { calendarFeedToken, isUsableIcalUrl } from "@/lib/icalSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!withAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const [properties, airbnbCounts] = await Promise.all([
    prisma.property.findMany({ orderBy: { id: "asc" }, include: { taxes: true } }),
    prisma.blockedDate.groupBy({
      by: ["propertyId"],
      where: { source: "AIRBNB", date: { gte: new Date() } },
      _count: { _all: true },
    }),
  ]);
  const upcomingAirbnbNights = new Map(airbnbCounts.map((row) => [row.propertyId, row._count._all]));

  return NextResponse.json({
    properties: properties.map((property) => ({
      id: property.id,
      name: property.name,
      slug: property.slug,
      airbnbIcalUrl: property.airbnbIcalUrl,
      airbnbImportConfigured: isUsableIcalUrl(property.airbnbIcalUrl),
      upcomingAirbnbNights: upcomingAirbnbNights.get(property.id) ?? 0,
      exportUrl: `${origin}/api/ical/${property.slug}.ics?token=${calendarFeedToken(property.slug)}`,
      maxGuests: property.maxGuests,
      timezone: property.timezone,
      checkInTime: property.checkInTime,
      checkOutTime: property.checkOutTime,
      hostSupportEmail: property.hostSupportEmail,
      wifiSsid: property.wifiSsid,
      wifiPassword: property.wifiPassword,
      garageCode: property.garageCode,
      lockboxCode: property.lockboxCode,
      skiLockerDoorCode: property.skiLockerDoorCode,
      skiLockerNumber: property.skiLockerNumber,
      skiLockerCode: property.skiLockerCode,
      taxes: property.taxes.map((tax) => ({
        name: tax.name,
        ratePercent: Math.round(tax.rate * 10000) / 100,
        appliesTo: tax.appliesTo,
      })),
    })),
  });
}
