// src/app/api/properties/[slug]/check-availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type CheckAvailabilityBody = {
  checkIn: string;
  checkOut: string;
  guests?: number;
};

function normalizeToMidnight(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function POST(req: NextRequest) {
  try {
    // Derive slug from URL: /api/properties/[slug]/check-availability
    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    // ["api", "properties", "<slug>", "check-availability"]
    const slug = parts[2]; // e.g. "api"->0, "properties"->1, slug->2

    const body = (await req.json()) as CheckAvailabilityBody;
    console.log('[check-availability] Request:', { slug, body });

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    if (!body.checkIn || !body.checkOut) {
      return NextResponse.json(
        { error: 'checkIn and checkOut are required' },
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

    const checkInDate = normalizeToMidnight(new Date(body.checkIn));
    const checkOutDate = normalizeToMidnight(new Date(body.checkOut));

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: 'checkOut must be after checkIn' },
        { status: 400 }
      );
    }

    // 1) Check blocked dates (Airbnb + DIRECT)
    const anyBlocked = await prisma.blockedDate.findFirst({
      where: {
        propertyId: property.id,
        date: {
          gte: checkInDate,
          lt: checkOutDate,
        },
      },
    });

    if (anyBlocked) {
      return NextResponse.json({
        available: false,
        reason: 'DATES_BLOCKED',
      });
    }

    // 2) Check overlapping PAID bookings (double-check)
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        propertyId: property.id,
        status: 'PAID',
        // overlap: start < requested end AND end > requested start
        checkInDate: { lt: checkOutDate },
        checkOutDate: { gt: checkInDate },
      },
    });

    if (overlappingBooking) {
      return NextResponse.json({
        available: false,
        reason: 'EXISTING_BOOKING',
      });
    }

    // If we get here, the range looks free
    // Calculate pricing quote
    let quote = null;
    try {
      const guests = body.guests || 1;

      const { calculatePricing } = await import('@/lib/pricing/calculator');
      quote = await calculatePricing(property.slug, checkInDate, checkOutDate, guests);
    } catch (e) {
      console.warn('Failed to calculate pricing quote:', e);
    }

    return NextResponse.json({
      available: true,
      quote
    });
  } catch (error: any) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: String(error?.message ?? error),
      },
      { status: 500 }
    );
  }
}