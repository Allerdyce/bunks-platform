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

    // 3. Parse Body
    let body;
    try {
        body = JSON.parse(bodyText);
    } catch (e) {
        console.error("PriceLabs sync error: Invalid JSON", e);
        // Log JSON error to DB
        // ...
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // DEBUG LOGGING START
    try {
        const debugSource = `DEBUG_INCOMING: ${new Date().toISOString()} | TokenEnd=${token?.slice(-5)} | Bytes=${bodyText.length}`;
        // Update the debug record (Upsert)
        await prisma.propertyPricing.upsert({
            where: {
                propertyId_date: {
                    propertyId: 11, // Steamboat
                    date: new Date('2099-01-01T00:00:00Z')
                }
            },
            create: {
                propertyId: 11,
                date: new Date('2099-01-01T00:00:00Z'),
                priceCents: 0,
                isBlocked: true,
                source: debugSource
            },
            update: {
                source: debugSource,
                updatedAt: new Date()
            }
        });
    } catch (err) {
        console.error("Failed to write debug log", err);
    }
    // DEBUG LOGGING END

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
