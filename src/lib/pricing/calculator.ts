import { prisma } from '@/lib/prisma';
import { specialRateClient } from '@/lib/specialRateClient';
import type { Prisma } from '@prisma/client';
import type { PricingQuote, NightlyLineItem } from '@/types';

const isWeekendNight = (date: Date) => {
    const day = date.getUTCDay();
    return day === 5 || day === 6; // Friday & Saturday nights
};

const toISODate = (date: Date) => date.toISOString().split('T')[0];

// Direct booking economics: 10% off the owner-set (Airbnb-equivalent) nightly rate,
// plus a 5% Bunks service fee on the discounted nightly subtotal.
export const DIRECT_DISCOUNT = 0.1;
export const SERVICE_FEE_RATE = 0.05;

export async function calculatePricing(
    propertySlug: string,
    checkInDate: Date,
    checkOutDate: Date,
    guests: number
): Promise<PricingQuote> {
    const property = await prisma.property.findUnique({
        where: { slug: propertySlug },
        include: { taxes: true },
    });

    if (!property) {
        throw new Error(`Property not found: ${propertySlug}`);
    }

    // Fetch Special Rates
    const specialRates = await specialRateClient.findMany({
        where: {
            propertyId: property.id,
            date: {
                gte: checkInDate,
                lt: checkOutDate,
            },
        },
    });

    const specialByDate = new Map(
        specialRates.map((rate) => [toISODate(rate.date), rate])
    );

    const nightlyLineItems: NightlyLineItem[] = [];
    let undiscountedNightlySubtotalCents = 0;

    const weekdayRateCents = Number(property.weekdayRate ?? property.baseNightlyRate);
    const weekendRateCents = Number(property.weekendRate ?? property.baseNightlyRate);

    const cursor = new Date(checkInDate);

    while (cursor < checkOutDate) {
        const isoDate = toISODate(cursor);
        const special = specialByDate.get(isoDate);

        // Determine Source & Undiscounted Price
        let source: NightlyLineItem['source'] = 'WEEKDAY';
        let undiscountedCents = weekdayRateCents;

        // Owner-set rates (the Airbnb-equivalent price): date override > weekend > weekday.
        if (special && !special.isBlocked) {
            source = 'SPECIAL';
            undiscountedCents = special.price;
        } else if (isWeekendNight(cursor)) {
            source = 'WEEKEND';
            undiscountedCents = weekendRateCents;
        }

        // Direct bookings are 10% below the owner-set rate.
        const amountCents = Math.round(undiscountedCents * (1 - DIRECT_DISCOUNT));

        undiscountedNightlySubtotalCents += undiscountedCents;
        nightlyLineItems.push({ date: isoDate, amountCents, source });

        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const nightlySubtotalCents = nightlyLineItems.reduce((acc, item) => acc + item.amountCents, 0);
    const nights = nightlyLineItems.length;

    const cleaningFeeCents = Number(property.cleaningFee ?? 8500);
    const serviceFeeCents = Math.round(nightlySubtotalCents * SERVICE_FEE_RATE);

    let taxCents = 0;
    for (const tax of property.taxes) {
        let taxableBase = 0;
        if (tax.appliesTo.includes('nightly')) taxableBase += nightlySubtotalCents;
        if (tax.appliesTo.includes('cleaning')) taxableBase += cleaningFeeCents;
        if (tax.appliesTo.includes('service')) taxableBase += serviceFeeCents;
        taxCents += Math.round(taxableBase * tax.rate);
    }

    const totalPriceCents = nightlySubtotalCents + cleaningFeeCents + serviceFeeCents + taxCents;

    return {
        totalPriceCents,
        nightlySubtotalCents,
        cleaningFeeCents,
        serviceFeeCents,
        taxCents,
        undiscountedNightlySubtotalCents,
        nightlyLineItems,
        averageNightlyRateCents: nights > 0 ? Math.round(nightlySubtotalCents / nights) : 0,
        nights
    };
}
