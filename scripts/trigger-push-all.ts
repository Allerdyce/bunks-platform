
// Usage: npx tsx scripts/trigger-push-all.ts
// Note: This requires access to the database and env vars. Use in dev environment.

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We need to resolve aliases if we import from src.
// Since tsx might not handle it automatically without alias config in package.json or similar,
// we might face issues.
// Alternative: We can use the Prisma client directly here if we just want to fetch data and assume logical equivalence,
// OR we can rely on `tsconfig-paths` if available.
// Let's try importing the Service directly. If it fails, we fall back to a direct fetch approach.

// Mocking the import if alias fails:
// import { PriceLabsService } from "@/lib/pricelabs/service"; // This often fails in simple scripts.

// Let's copy relevant logic or use relative path if possible.
// ../src/lib/pricelabs/service.ts
import { PrismaClient } from '@prisma/client';
import { postPricelabs } from '../src/lib/pricelabs/client';

const prisma = new PrismaClient();

async function syncAll() {
    console.log("Fetching all properties...");
    const properties = await prisma.property.findMany({});
    console.log(`Found ${properties.length} properties.`);

    for (const property of properties) {
        console.log(`Pushing Listing: ${property.name} (${property.id})`);

        const payload = {
            listing_id: property.pricelabsListingId || String(property.id),
            user_token: property.hostSupportEmail || process.env.PRICELABS_DEFAULT_USER_EMAIL || "ops@bunks.com",
            pms_name: "bunks",
            name: property.name,
            address: {
                latitude: property.latitude,
                longitude: property.longitude
            },
            listing_type: "vacation_rental",
        };

        try {
            await postPricelabs("listings", payload);
            console.log(`✅ Success: ${property.id}`);
        } catch (e) {
            console.error(`❌ Failed: ${property.id}`, e);
        }

        // Push Calendar Initial
        // ... (Simplified for this test: just listing sync)
    }
}

syncAll()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
