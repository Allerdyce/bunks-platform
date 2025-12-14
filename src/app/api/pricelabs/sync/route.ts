import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const token = req.headers.get("x-integration-token");
    const name = req.headers.get("x-integration-name");

    if (
        token !== process.env.PRICELABS_INTEGRATION_TOKEN ||
        name !== process.env.PRICELABS_INTEGRATION_NAME
    ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        // PriceLabs payload structure:
        // { listing_id: "...", prices: [ { date: "YYYY-MM-DD", price: 123, min_stay: 2, ... } ] }

        // Depending on actual payload, we might need to iterate or handle bulk
        // Per documentation/standard, it's typically one listing per request or a list of listings
        // We'll assume the standard connector payload format.
        // However, exact payload shape might vary. We'll log it for now if unsure,
        // but typically:
        // {
        //   "listing_id": "string",
        //   "data": [
        //     { "date": "2024-01-01", "price": 100, "min_stay": 2, ... }
        //   ]
        // }

        // Let's implement a robust handler that checks for `data` array
        const updates = Array.isArray(body) ? body : [body];

        for (const update of updates) {
            const listingId = update.listing_id || update.id;
            if (!listingId) continue;

            const property = await prisma.property.findFirst({
                where: { pricelabsListingId: String(listingId) },
            });

            if (!property) {
                console.warn(`PriceLabs sync: Property not found for listingId ${listingId}`);
                continue;
            }

            if (update.data && Array.isArray(update.data)) {
                for (const item of update.data) {
                    // item: { date: '2022-01-01', price: 100, min_stay: 3 }
                    const date = new Date(item.date);
                    const priceCents = Math.round(Number(item.price) * 100);
                    const minNights = item.min_stay ? Number(item.min_stay) : undefined;

                    // Standard PriceLabs connector field for blocking is often `is_blocked` or implied by external sources.
                    // If they send `is_blocked` (bool), we use it.
                    const isBlocked = 'is_blocked' in item ? Boolean(item.is_blocked) : false;

                    await prisma.propertyPricing.upsert({
                        where: {
                            propertyId_date: {
                                propertyId: property.id,
                                date: date,
                            },
                        },
                        create: {
                            propertyId: property.id,
                            date: date,
                            priceCents,
                            minNights,
                            isBlocked,
                            source: "pricelabs",
                        },
                        update: {
                            priceCents,
                            minNights,
                            isBlocked,
                            source: "pricelabs",
                            updatedAt: new Date(),
                        },
                    });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PriceLabs sync error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
