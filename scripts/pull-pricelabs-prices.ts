
import { PrismaClient } from '@prisma/client';
import { PriceLabsCustomerApiClient } from '../src/lib/pricelabs/customer-api';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

console.log("DEBUG: API KEY loaded?", process.env.PRICELABS_API_KEY ? "YES" : "NO");

const api = new PriceLabsCustomerApiClient();

async function main() {
    console.log("Starting PriceLabs Read-Only Sync...");

    // 1. Get properties with a mapped PriceLabs Listing ID
    const properties = await prisma.property.findMany({
        where: {
            pricelabsListingId: { not: null }
        }
    });

    console.log(`Found ${properties.length} properties to sync.`);

    for (const property of properties) {
        if (!property.pricelabsListingId) continue;

        console.log(`\n--- Syncing Property: ${property.name} [${property.pricelabsListingId}] ---`);

        try {
            const prices = await api.getListingPrices(property.pricelabsListingId);
            console.log(`Retrieved ${prices.length} price records.`);

            let updatedCount = 0;

            for (const p of prices) {
                const date = new Date(p.date);

                // If date is invalid or in past? PriceLabs usually returns future.
                // We store everything returned.

                // Upsert
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
                        priceCents: Math.round(p.price * 100), // Convert to cents
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
            console.log(`Successfully updated ${updatedCount} DB records.`);

        } catch (error) {
            console.error(`Failed to sync property ${property.id}:`, error);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
