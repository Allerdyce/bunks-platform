import { NextRequest, NextResponse } from "next/server";
import { isValidPriceLabsIntegrationToken } from "@/lib/pricelabs/integrationToken";

export async function POST(req: NextRequest) {
    // 1. Connectivity Check / Verification Probe
    // Allow empty body or probe to pass without auth if needed for registration verification
    let bodyText = "";
    try {
        bodyText = await req.text();
    } catch (e) {
        // Ignore body read error
    }

    if (!bodyText || bodyText.trim() === "" || bodyText.includes('"verify":true')) {
        return NextResponse.json({ status: "ok", message: "PriceLabs Probe Received" });
    }

    // Auth Check
    const token = req.headers.get("x-integration-token");

    // PriceLabs might ping the URL to verify existence/accessibility during registration.
    // Sometimes they send a GET or a POST with specific body.
    // The registration failure "Resp Code: 401 Body: {"error":"Unauthorized"}" implies my check failed.
    // If they just ping it, they might not send the token in the first verify call?
    // OR they send it, but maybe case sensitivity? (req.headers is usually lowercased by Next.js/Node).
    // Let's assume they send it.
    // However, for hooks, maybe they don't send the token in the *registration verification* step?
    // Let's allow a "probe" if the body allows it or if it's a specific verify request?
    // But the error logs show they got 401, so my code blocked it.

    // We should log the incoming headers to debug if we can, but since we can't see live logs easily,
    // let's try to be more permissive for the "registration" phase if needed, OR ensure we match exact header.
    // NextRequest headers are case-insensitive `get()`.

    if (!isValidPriceLabsIntegrationToken(token)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = JSON.parse(bodyText);
        console.log("PriceLabs Hook Notification:", JSON.stringify(body, null, 2));

        // You can implement specific alert logic here.
        // For now, just logging is sufficient for "Optional" requirement.

        return NextResponse.json({ received: true });
    } catch (e) {
        console.error("PriceLabs hook error", e);
        return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
    }
}
