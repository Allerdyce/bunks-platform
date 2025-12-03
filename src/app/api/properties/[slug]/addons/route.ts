import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isFeatureEnabled } from '@/lib/featureFlags';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    slug?: string;
  }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const slug = (await params)?.slug;

  if (!slug) {
    return NextResponse.json({ error: 'Property slug is required' }, { status: 400 });
  }

  try {
    const property = await prisma.property.findUnique({
      where: { slug },
      select: {
        slug: true,
        addons: {
          where: { isActive: true },
          orderBy: { title: 'asc' },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            category: true,
            provider: true,
            providerProductId: true,
            basePriceCents: true,
            currency: true,
            durationMinutes: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const addonsEnabled = await isFeatureEnabled('addons');

    return NextResponse.json({
      property: property.slug,
      addons: addonsEnabled ? property.addons : [],
      featureFlags: {
        addonsEnabled,
      },
    });
  } catch (error) {
    console.error('[addons] Failed to load property add-ons', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
