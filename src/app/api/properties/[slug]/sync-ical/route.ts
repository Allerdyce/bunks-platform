import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/adminAuth';
import { isAuthorizedCronRequest } from '@/lib/cronAuth';
import { IcalSyncError, syncAirbnbCalendar } from '@/lib/icalSync';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const isAdmin = Boolean(withAdminAuth(req));
  if (!isAdmin && !isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Only an admin can confirm that an empty Airbnb calendar is real (clearing future blocks).
  const body = (await req.json().catch(() => ({}))) as { allowEmpty?: boolean };
  const allowEmpty = isAdmin && body.allowEmpty === true;

  const { slug } = await params;
  const property = await prisma.property.findUnique({
    where: { slug },
    select: { id: true, slug: true, airbnbIcalUrl: true },
  });

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  try {
    const result = await syncAirbnbCalendar(property, { allowEmpty });
    return NextResponse.json({ property: slug, ...result }, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error('Error syncing iCal:', error);
    if (error instanceof IcalSyncError) {
      return NextResponse.json(
        { error: error.message, reason: error.reason },
        { status: error.reason === 'EMPTY_FEED' ? 409 : 502 }
      );
    }
    return NextResponse.json({ error: 'Failed to sync Airbnb calendar' }, { status: 502 });
  }
}
