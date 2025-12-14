import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const token = req.headers.get("x-integration-token");
    const name = req.headers.get("x-integration-name");

    if (
        token !== process.env.PRICELABS_INTEGRATION_TOKEN ||
        name !== process.env.PRICELABS_INTEGRATION_NAME
    ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Acknowledge the trigger. 
    // In a real implementation, we would queue a job to push availability to PriceLabs.
    // For v1, we just return OK.
    console.log("PriceLabs calendar trigger received");

    return NextResponse.json({ success: true });
}
