// src/app/api/properties/[slug]/check-availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUnavailableNights, parseStayDate } from '@/lib/bookingAvailability';
import { checkStayRules } from '@/lib/stayRules';
import { PriceUnavailableError } from '@/lib/airbnbRates';

export const runtime = 'nodejs';

type CheckAvailabilityBody = {
  checkIn: string;
  checkOut: string;
  guests?: number;
};

export async function POST(req: NextRequest) {
  try {
    // Derive slug from URL: /api/properties/[slug]/check-availability
    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    // ["api", "properties", "<slug>", "check-availability"]
    const slug = parts[2]; // e.g. "api"->0, "properties"->1, slug->2

    const body = (await req.json()) as CheckAvailabilityBody;

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

    const checkInDate = parseStayDate(body.checkIn);
    const checkOutDate = parseStayDate(body.checkOut);

    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: 'Invalid date format (expected YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: 'checkOut must be after checkIn' },
        { status: 400 }
      );
    }

    // Same rules as checkout, so the quote never says "available" for a stay checkout will reject.
    const violation = checkStayRules(property, checkInDate, checkOutDate);
    if (violation) {
      return NextResponse.json({ available: false, reason: violation.error, message: violation.message, minimumNights: violation.minimumNights });
    }

    // Checkout holds are enforced when the booking is created, not in the public quote.
    const unavailable = await getUnavailableNights(property.id, checkInDate, checkOutDate, {
      includePendingHolds: false,
    });

    if (unavailable.size > 0) {
      return NextResponse.json({
        available: false,
        reason: 'DATES_UNAVAILABLE',
        unavailableNights: Array.from(unavailable).sort(),
      });
    }

    // If we get here, the range looks free
    // Calculate pricing quote
    let quote = null;
    try {
      const guests = Math.max(1, Math.min(Number(body.guests) || 1, property.maxGuests ?? 16));

      const { calculatePricing } = await import('@/lib/pricing/calculator');
      quote = await calculatePricing(property.slug, checkInDate, checkOutDate, guests);
    } catch (e) {
      if (e instanceof PriceUnavailableError) {
        return NextResponse.json({ available: false, reason: 'PRICE_UNAVAILABLE', message: e.message });
      }
      console.warn('Failed to calculate pricing quote:', e);
    }

    return NextResponse.json({
      available: true,
      quote
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Unable to check availability right now.' },
      { status: 500 }
    );
  }
}