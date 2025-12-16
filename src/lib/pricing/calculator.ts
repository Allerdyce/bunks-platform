import { prisma } from '@/lib/prisma';
import { specialRateClient } from '@/lib/specialRateClient';
import type { Prisma } from '@prisma/client';
import type { PricingQuote, NightlyLineItem } from '@/types';

const isWeekendNight = (date: Date) => {
    const day = date.getUTCDay();
    return day === 5 || day === 6; // Friday & Saturday nights
};

const toISODate = (date: Date) => date.toISOString().split('T')[0];

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

    // Fetch PriceLabs Rates
    let priceLabsRates: any[] = [];
    if ((prisma as any).propertyPricing) {
        priceLabsRates = await (prisma as any).propertyPricing.findMany({
            where: {
                propertyId: property.id,
                date: {
                    gte: checkInDate,
                    lt: checkOutDate,
                },
            },
        });
    }

    const priceLabsByDate = new Map(
        priceLabsRates.map((rate: any) => [toISODate(rate.date), rate])
    );

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
        const priceLabs = priceLabsByDate.get(isoDate);

        // Determine Source & Undiscounted Price
        let source: NightlyLineItem['source'] = 'WEEKDAY';
        let undiscountedCents = weekdayRateCents;

        // Priority: Special (Admin Override) > PriceLabs (Dynamic) > Static Weekend/Weekday
        if (special && !special.isBlocked) {
            source = 'SPECIAL';
            undiscountedCents = special.price;
        } else if (priceLabs && !priceLabs.isBlocked) {
            source = 'PRICELABS';
            undiscountedCents = priceLabs.priceCents;
        } else if (isWeekendNight(cursor)) {
            source = 'WEEKEND';
            undiscountedCents = weekendRateCents;
        }

        // Apply 10% Discount
        const amountCents = Math.round(undiscountedCents * 0.90);

        undiscountedNightlySubtotalCents += undiscountedCents;
        nightlyLineItems.push({ date: isoDate, amountCents, source });

        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const nightlySubtotalCents = nightlyLineItems.reduce((acc, item) => acc + item.amountCents, 0);
    const nights = nightlyLineItems.length;

    const cleaningFeeCents = Number(property.cleaningFee ?? 8500);
    const serviceFeeCents = Math.round(nightlySubtotalCents * 0.15);

    let taxCents = 0;
    // @ts-ignore - Property type inference with include is complex, but we known taxes are included
    if (property.taxes) {
        // @ts-ignore
        for (const tax of property.taxes) {
            let taxableBase = 0;
            if (tax.appliesTo.includes('nightly')) taxableBase += nightlySubtotalCents;
            if (tax.appliesTo.includes('cleaning')) taxableBase += cleaningFeeCents;
            if (tax.appliesTo.includes('service')) taxableBase += serviceFeeCents;
            taxCents += Math.round(taxableBase * tax.rate);
        }
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
