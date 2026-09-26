import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildCalendarFeed, isValidCalendarFeedToken } from '@/lib/icalSync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Private availability feed for Airbnb/VRBO to import: /api/ical/<slug>?token=<token>
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.replace(/\.ics$/, '');

  if (!isValidCalendarFeedToken(slug, req.nextUrl.searchParams.get('token'))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const property = await prisma.property.findUnique({ where: { slug }, select: { id: true, slug: true, name: true } });
  if (!property) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return new NextResponse(await buildCalendarFeed(property), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
