import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUnavailableNights, toISODate } from '@/lib/bookingAvailability';
import { syncAirbnbCalendarIfStale } from '@/lib/icalSync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_DAYS = 550;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const property = await prisma.property.findUnique({ where: { slug } });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    await syncAirbnbCalendarIfStale(property);

    const today = new Date();
    const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
    const to = new Date(from.getTime() + WINDOW_DAYS * 86_400_000);

    const [unavailable, pricing] = await Promise.all([
      getUnavailableNights(property.id, from, to, { includePendingHolds: false }),
      prisma.propertyPricing.findMany({
        where: { propertyId: property.id, date: { gte: from }, minNights: { gt: 1 } },
        select: { date: true, minNights: true },
      }),
    ]);

    const minStay: Record<string, number> = {};
    for (const row of pricing) {
      if (row.minNights) minStay[toISODate(row.date)] = row.minNights;
    }

    return NextResponse.json({
      property: slug,
      blockedDates: Array.from(unavailable).sort().map((date) => ({ date })),
      minStay,
    });
  } catch (error) {
    // Never invent availability: the calendar shows an error instead.
    console.error('Error fetching blocked dates:', error);
    return NextResponse.json({ error: 'Availability is temporarily unavailable' }, { status: 503 });
  }
}
