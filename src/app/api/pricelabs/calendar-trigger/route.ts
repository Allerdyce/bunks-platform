import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PriceLabsService } from "@/lib/pricelabs/service";

/**
 * Handle PriceLabs "Calendar Trigger" to refresh availability.
 */
export async function POST(req: NextRequest) {
    try {
        // Auth Check
        const token = req.headers.get("x-integration-token");
        if (token !== process.env.PRICELABS_INTEGRATION_TOKEN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const listingId = body.listing_id; // Can be a string or array? Guide says "list of listing_ids" but sometimes one.

        // Guide: "PriceLabs will call this URL (with a list of listing_ids)..."
        // It might be `{ listing_ids: [...] }` or just one id?
        // Let's assume standard object. If it's just `listing_id` or `listing_ids`.

        let ids: string[] = [];
        if (Array.isArray(body.listing_ids)) {
            ids = body.listing_ids;
        } else if (body.listing_id) {
            ids = [body.listing_id];
        }

        if (ids.length === 0) {
            // If no ignored IDs, maybe it wants a full refresh?
            // Safer to return "ok" or do nothing if ambiguous.
            return NextResponse.json({ message: "No listing IDs provided" });
        }

        // We should trigger the sync asynchronously to avoid timeout?
        // Node / Vercel serverless has 10s limit sometimes.
        // But for <10 items it's fast. 
        // We will execute sequentially for now.

        // Find properties
        const results = [];
        for (const pid of ids) {
            let property = await prisma.property.findUnique({
                where: { pricelabsListingId: String(pid) }
            });

            if (!property && !isNaN(Number(pid))) {
                property = await prisma.property.findUnique({
                    where: { id: Number(pid) }
                });
            }

            if (property) {
                // Trigger Calendar Push
                await PriceLabsService.syncCalendar(property.id);
                results.push(pid);
            }
        }

        return NextResponse.json({ success: true, triggered_for: results });

    } catch (error) {
        console.error("Calendar Trigger Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
