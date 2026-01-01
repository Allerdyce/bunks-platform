import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type BlockedDatePayload = {
  date: string;
  source: string;
};

const DEFAULT_OFFSETS = [5, 6, 20, 21, 22];
const SLUG_SPECIFIC_OFFSETS: Record<string, number[]> = {
  'summerland-ocean-view-beach-bungalow': [3, 4, 10, 11, 17, 18],
  'steamboat-downtown-townhome': [2, 3, 12, 13, 25, 26],
};

const toISODate = (date: Date) => date.toISOString().split('T')[0];

const buildFallbackBlockedDates = (slug: string): BlockedDatePayload[] => {
  const today = new Date();
  const offsets = SLUG_SPECIFIC_OFFSETS[slug] ?? DEFAULT_OFFSETS;
  return offsets.map((offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    return {
      date: toISODate(date),
      source: 'FALLBACK',
    };
  });
};

const respondWithFallback = (slug: string) =>
  NextResponse.json({
    property: slug,
    blockedDates: buildFallbackBlockedDates(slug),
    fallback: true,
  });

async function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    return prisma;
  } catch (error) {
    console.error('Prisma client unavailable for blocked dates:', error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  // Derive slug from URL path: /api/properties/[slug]/blocked-dates
  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // ["api", "properties", "<slug>", "blocked-dates"]
  const slug = parts[2];

  if (!slug) {
    return NextResponse.json(
      { error: 'Missing slug in route' },
      { status: 400 }
    );
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    return respondWithFallback(slug);
  }

  try {
    const property = await prisma.property.findUnique({
      where: { slug },
    });

    if (!property) {
      return respondWithFallback(slug);
    }

    const blocked = await prisma.blockedDate.findMany({
      where: { propertyId: property.id },
      orderBy: { date: 'asc' },
    });

    // Fetch PropertyPricing for minNights and additional blocks
    const pricing = await prisma.propertyPricing.findMany({
      where: {
        propertyId: property.id,
        date: { gte: new Date() },
      },
      select: {
        date: true,
        isBlocked: true,
        minNights: true,
      },
    });

    const specialDelegate = (prisma as unknown as {
      specialRate?: {
        findMany: (...args: any[]) => Promise<any>;
      };
    }).specialRate;

    const specialBlocks = specialDelegate
      ? ((await specialDelegate.findMany({
        where: { propertyId: property.id, isBlocked: true },
        orderBy: { date: 'asc' },
      })) as { date: Date }[])
      : [];

    const minStayMap: Record<string, number> = {};
    const pricingBlockedDates: BlockedDatePayload[] = [];

    pricing.forEach((p) => {
      const dateStr = toISODate(p.date);
      if (p.minNights && p.minNights > 1) {
        minStayMap[dateStr] = p.minNights;
      }
      if (p.isBlocked) {
        pricingBlockedDates.push({ date: dateStr, source: 'PRICELABS' });
      }
    });

    // Combine all blocked dates
    // Priority: BlockedDate > SpecialRate > PropertyPricing
    // Actually, we just want to merge them.
    const uniqueBlockedDates = new Map<string, BlockedDatePayload>();

    // 1. Base blocked dates
    blocked.forEach((b) => {
      const dateStr = toISODate(b.date);
      uniqueBlockedDates.set(dateStr, { date: dateStr, source: b.source });
    });

    // 2. Special blocks
    specialBlocks.forEach((s) => {
      const dateStr = toISODate(s.date);
      uniqueBlockedDates.set(dateStr, { date: dateStr, source: 'SPECIAL' });
    });

    // 3. Pricing blocks (if not already blocked)
    pricingBlockedDates.forEach((p) => {
      if (!uniqueBlockedDates.has(p.date)) {
        uniqueBlockedDates.set(p.date, p);
      }
    });

    const dates = Array.from(uniqueBlockedDates.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      property: slug,
      blockedDates: dates,
      minStay: minStayMap
    });
  } catch (error: any) {
    console.error('Error fetching blocked dates:', error);
    return respondWithFallback(slug);
  }
}