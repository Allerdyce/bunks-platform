import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorizedCronRequest } from '@/lib/cronAuth';
import { syncAirbnbCalendar } from '@/lib/icalSync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Backstop for the on-demand sync that runs before checkout and calendar loads.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const properties = await prisma.property.findMany({ select: { id: true, slug: true, airbnbIcalUrl: true } });
  const results = [];
  for (const property of properties) {
    try {
      results.push({ slug: property.slug, ...(await syncAirbnbCalendar(property)) });
    } catch (error) {
      console.error(`[cron][ical-sync] ${property.slug} failed`, error);
      results.push({ slug: property.slug, ok: false, reason: 'FETCH_FAILED' });
    }
  }
  return NextResponse.json({ results });
}
