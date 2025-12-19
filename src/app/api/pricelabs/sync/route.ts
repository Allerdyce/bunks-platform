import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    let bodyText = "";
    try {
        bodyText = await req.text();
    } catch (e) {
        console.error("Failed to read request body", e);
        return NextResponse.json({ error: "Empty Body" }, { status: 400 });
    }

    // 1. Connectivity Check / Verification Probe
    // PriceLabs sometimes sends empty body or specific probe payload
    if (!bodyText || bodyText.trim() === "" || bodyText.includes('"verify":true')) {
        return NextResponse.json({ status: "ok", message: "PriceLabs Probe Received" });
    }

    // 2. Authentication
    const receivedToken = req.headers.get("x-integration-token");
    const configuredToken = process.env.PRICELABS_INTEGRATION_TOKEN;

    if (!receivedToken || receivedToken !== configuredToken) {
        console.warn(`PriceLabs Unauthorized Sync Attempt. Recv: ${receivedToken?.slice(-5)}...`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Parse Body
    let updates: any[] = [];
    try {
        const json = JSON.parse(bodyText);
        updates = Array.isArray(json) ? json : [json];
    } catch (e) {
        console.error("PriceLabs sync error: Invalid JSON", e);
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // 4. Process Updates
    console.log(`Processing PriceLabs Sync: ${updates.length} updates received.`);

    try {
        for (const update of updates) {
            const listingId = update.listing_id || update.id;
            if (!listingId) continue;

            // Find property by PriceLabs ID or fallback to mapping if ID matches our ID scheme
            // Schema has `pricelabsListingId` which is unique.
            let property = await prisma.property.findUnique({
                where: { pricelabsListingId: String(listingId) }
            });

            // Fallback: Check if listingId is our internal numeric ID (stringified)
            if (!property && !isNaN(Number(listingId))) {
                property = await prisma.property.findUnique({
                    where: { id: Number(listingId) }
                });
            }

            if (!property) {
                console.warn(`Skipping PriceLabs update for unknown listingId: ${listingId}`);
                continue;
            }

            if (update.data && Array.isArray(update.data)) {

                // Transactional update per listing is safer, but loop is fine for performance here
                // We use upsert for each date.

                for (const item of update.data) {
                    const date = new Date(item.date);
                    // PriceLabs sends price in dollars/float usually, we store cents.
                    const priceCents = Math.round(Number(item.price) * 100);
                    const minNights = item.min_stay ? Number(item.min_stay) : undefined;

                    // is_blocked behavior:
                    // If PL says blocked, we mark it blocked.
                    // If PL says NOT blocked, we might unblock ONLY if the source was pricelabs?
                    // Actually, usually pricing sync shouldn't override manual blocks if handled elsewhere,
                    // but here we are storing in PropertyPricing table which is dedicated to automated rules/prices usually.
                    // The schema has `isBlocked` on `PropertyPricing`.
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

        return NextResponse.json({ success: true, updated_count: updates.length });
    } catch (error) {
        console.error("PriceLabs sync processing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
