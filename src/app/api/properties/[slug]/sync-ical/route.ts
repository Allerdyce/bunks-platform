import { NextRequest, NextResponse } from 'next/server';
import * as ical from 'ical';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Derive slug from URL: /api/properties/[slug]/sync-ical
    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const slug = parts[2];

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing slug in route' },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { slug },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found', slug },
        { status: 404 }
      );
    }

    if (property.pricelabsListingId) {
      return NextResponse.json(
        { message: 'Property is managed by PriceLabs; iCal sync skipped.', slug },
        { status: 200 }
      );
    }

    if (!property.airbnbIcalUrl) {
      return NextResponse.json(
        { error: 'Property has no iCal URL configured', slug },
        { status: 400 }
      );
    }

    const res = await fetch(property.airbnbIcalUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch iCal', statusCode: res.status },
        { status: 502 }
      );
    }

    const icsText = await res.text();
    const parsed = ical.parseICS(icsText);

    const blockedDates: Date[] = [];

    for (const key in parsed) {
      const event = parsed[key];
      if (!event || !event.start || !event.end) continue;

      const start = new Date(event.start);
      const end = new Date(event.end);

      const cursor = new Date(start);
      while (cursor < end) {
        const day = new Date(
          cursor.getFullYear(),
          cursor.getMonth(),
          cursor.getDate()
        );
        blockedDates.push(day);
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    await prisma.blockedDate.deleteMany({
      where: {
        propertyId: property.id,
        source: 'AIRBNB',
      },
    });

    if (blockedDates.length > 0) {
      const uniqueIsoDates = Array.from(
        new Set(blockedDates.map((d) => d.toISOString()))
      );

      await prisma.blockedDate.createMany({
        data: uniqueIsoDates.map((iso) => ({
          propertyId: property.id,
          date: new Date(iso),
          source: 'AIRBNB',
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      ok: true,
      property: slug,
      blockedCount: blockedDates.length,
    });
  } catch (error: any) {
    console.error('Error syncing iCal:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: String(error?.message ?? error),
      },
      { status: 500 }
    );
  }
}