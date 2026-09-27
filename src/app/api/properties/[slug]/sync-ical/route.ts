import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/adminAuth';
import { isAuthorizedCronRequest } from '@/lib/cronAuth';
import { syncAirbnbCalendar } from '@/lib/icalSync';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!withAdminAuth(req) && !isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const property = await prisma.property.findUnique({
    where: { slug },
    select: { id: true, slug: true, airbnbIcalUrl: true },
  });

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  try {
    const result = await syncAirbnbCalendar(property);
    return NextResponse.json({ property: slug, ...result }, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error('Error syncing iCal:', error);
    return NextResponse.json({ error: 'Failed to sync Airbnb calendar' }, { status: 502 });
  }
}
