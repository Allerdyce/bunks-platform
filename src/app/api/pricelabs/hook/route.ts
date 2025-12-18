import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    let bodyText = "";
    try {
        bodyText = await req.text();
    } catch (e) {
        console.error("Failed to read request body", e);
    }

    const token = req.headers.get("x-integration-token");

    // DEBUG: Trap payload in DB
    try {
        const debugProp = await prisma.property.findFirst();
        if (debugProp) {
            await prisma.propertyPricing.upsert({
                where: {
                    propertyId_date: {
                        propertyId: debugProp.id,
                        date: new Date("2099-12-30T00:00:00.000Z"), // Different date for HOOK (Dec 30)
                    },
                },
                create: {
                    propertyId: debugProp.id,
                    date: new Date("2099-12-30T00:00:00.000Z"),
                    priceCents: 99999,
                    source: `HOOK DEBUG: Token=${token} | Body=${bodyText.substring(0, 800)}`,
                    isBlocked: true,
                },
                update: {
                    source: `HOOK DEBUG: Token=${token} | Body=${bodyText.substring(0, 800)}`,
                    updatedAt: new Date(),
                }
            });
        }
    } catch (e) { console.error("Debug log failed", e); }

    const name = req.headers.get("x-integration-name");

    if (
        token !== process.env.PRICELABS_INTEGRATION_TOKEN ||
        name !== process.env.PRICELABS_INTEGRATION_NAME
    ) {
        // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // Allow for debug
    }

    // Generic hook handler
    console.log("PriceLabs hook received");

    return NextResponse.json({ success: true });
}
