import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/adminAuth';
import { calendarFeedToken, isUsableIcalUrl } from '@/lib/icalSync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lists each property's private export URL (paste into Airbnb/VRBO calendar import)
// and whether its Airbnb import URL is configured.
export async function GET(request: NextRequest) {
  if (!withAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const properties = await prisma.property.findMany({
    select: { slug: true, name: true, airbnbIcalUrl: true },
    orderBy: { id: 'asc' },
  });

  return NextResponse.json({
    feeds: properties.map((property) => ({
      name: property.name,
      slug: property.slug,
      exportUrl: `${origin}/api/ical/${property.slug}.ics?token=${calendarFeedToken(property.slug)}`,
      airbnbImportConfigured: isUsableIcalUrl(property.airbnbIcalUrl),
    })),
  });
}
