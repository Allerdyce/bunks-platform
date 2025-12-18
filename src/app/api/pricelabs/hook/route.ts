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

    // Generic hook handler
    console.log("PriceLabs hook received");

    return NextResponse.json({ success: true });
}
