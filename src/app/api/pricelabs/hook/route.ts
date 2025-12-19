import { NextRequest, NextResponse } from "next/server";

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

    if (token !== process.env.PRICELABS_INTEGRATION_TOKEN) {
        // Fallback: Check if they passed it in query string? (PriceLabs sometimes does `?token=...`)
        // The guide says "Store the integration token... will use it in ... headers".

        // Relaxing for registration probe:
        // If body represents a probe/verify?
        // We haven't read body yet.
        // Let's read body safely.

        // Return 401 strictly for security, BUT maybe logged error helps.
        // Let's try to debug by returning the received token in error message (temp)? No, security risk.
        // Let's check if the token env var is actually set correctly in local dev?
        // The script ran passed, so env var is there.

        // Maybe PriceLabs sends headers as `X-Integration-Token` and Next.js normalizes?
        // `req.headers.get` is case-insensitive.

        // Is it possible the Hook URL verification sends a DIFFERENT token?
        // Or no token (public ping)?
        // Guide: "Hook URL (Optional)... PriceLabs may call this..."
        // Doesn't explicitly say "Verification call includes token".
        // But usually it does.

        // Let's try to parse body first to see if it's a verify attempt?
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
