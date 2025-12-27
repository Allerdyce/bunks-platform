
import { PrismaClient } from '@prisma/client';
import { PriceLabsCustomerApiClient } from './customer-api';

const prisma = new PrismaClient();
const api = new PriceLabsCustomerApiClient();

export async function syncPriceLabsData() {
    console.log("[Sync] Starting PriceLabs Read-Only Sync...");

    const properties = await prisma.property.findMany({
        where: {
            pricelabsListingId: { not: null }
        }
    });

    console.log(`[Sync] Found ${properties.length} properties to sync.`);
    const results = [];

    for (const property of properties) {
        if (!property.pricelabsListingId) continue;

        console.log(`\n--- Syncing Property: ${property.name} [${property.pricelabsListingId}] ---`);

        try {
            const prices = await api.getListingPrices(property.pricelabsListingId);
            console.log(`[Sync] Retrieved ${prices.length} price records.`);

            let updatedCount = 0;

            for (const p of prices) {
                const date = new Date(p.date);

                await prisma.propertyPricing.upsert({
                    where: {
                        propertyId_date: {
                            propertyId: property.id,
                            date: date
                        }
                    },
                    create: {
                        propertyId: property.id,
                        date: date,
                        priceCents: Math.round(p.price * 100),
                        minNights: p.min_stay,
                        isBlocked: p.booking_status === 'Booked' || p.booking_status === 'Reserved' || Boolean(p.unbookable),
                        source: 'pricelabs'
                    },
                    update: {
                        priceCents: Math.round(p.price * 100),
                        minNights: p.min_stay,
                        isBlocked: p.booking_status === 'Booked' || p.booking_status === 'Reserved' || Boolean(p.unbookable),
                        source: 'pricelabs',
                        updatedAt: new Date()
                    }
                });
                updatedCount++;
            }
            console.log(`[Sync] Successfully updated ${updatedCount} DB records.`);
            results.push({ propertyId: property.id, status: 'success', count: updatedCount });

        } catch (error) {
            console.error(`[Sync] Failed to sync property ${property.id}:`, error);
            results.push({ propertyId: property.id, status: 'error', error: String(error) });
        }
    }

    return results;
}
