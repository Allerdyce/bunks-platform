import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    let bodyText = "";
    try {
        bodyText = await req.text();
    } catch (e) {
        console.error("Failed to read request body", e);
    }

    // 1. Allow verification probes to bypass auth
    // PriceLabs sends empty body or {"verify":true} to check connectivity
    if (!bodyText || bodyText.includes('"verify":true') || bodyText.includes('"verify": true')) {
        return NextResponse.json({ status: "ok" });
    }

    // 2. Authenticate payload requests
    const token = req.headers.get("x-integration-token");
    if (token !== process.env.PRICELABS_INTEGRATION_TOKEN) {
        console.error("PriceLabs sync auth failed. Token mismatch.");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // DEBUG: Write payload to DB to inspect data structure
    try {
        const debugProp = await prisma.property.findFirst();
        if (debugProp) {
            await prisma.propertyPricing.upsert({
                where: {
                    propertyId_date: {
                        propertyId: debugProp.id,
                        date: new Date("2099-12-31T00:00:00.000Z"),
                    },
                },
                create: {
                    propertyId: debugProp.id, // Assuming property ID 11 based on prev logs
                    date: new Date("2099-12-31T00:00:00.000Z"),
                    priceCents: 99999,
                    source: `DEBUG: ${bodyText.substring(0, 1000)}`, // Log payload here
                    isBlocked: true,
                },
                update: {
                    source: `DEBUG: ${bodyText.substring(0, 1000)}`,
                    updatedAt: new Date(),
                }
            });
        }
    } catch (e) { console.error("Debug log failed", e); }

    // 3. Parse Body
    let body;
    try {
        body = JSON.parse(bodyText);
    } catch (e) {
        console.error("PriceLabs sync error: Invalid JSON", e);
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    try {
        const updates = Array.isArray(body) ? body : [body];

        for (const update of updates) {
            const listingId = update.listing_id || update.id;
            if (!listingId) continue;

            const property = await prisma.property.findFirst({
                // @ts-ignore - Schema mismatch potential
                where: { pricelabsListingId: String(listingId) },
            });

            if (!property) {
                console.warn(`PriceLabs sync: Property not found for listingId ${listingId}`);
                continue;
            }

            if (update.data && Array.isArray(update.data)) {
                for (const item of update.data) {
                    const date = new Date(item.date);
                    const priceCents = Math.round(Number(item.price) * 100);
                    const minNights = item.min_stay ? Number(item.min_stay) : undefined;
                    const isBlocked = 'is_blocked' in item ? Boolean(item.is_blocked) : false;

                    // @ts-ignore - Schema mismatch potential
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
