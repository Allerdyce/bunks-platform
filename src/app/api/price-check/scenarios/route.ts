import crypto from "crypto";
import { NextResponse } from "next/server";
import { buildScenarios, isAuthorizedPriceCheckRequest } from "@/lib/priceCheck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stays for the Airbnb price runner to quote (see lib/priceCheck). */
export async function GET(request: Request) {
  if (!isAuthorizedPriceCheckRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const scenarios = await buildScenarios();
    return NextResponse.json(
      { runId: `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`, currency: "USD", locale: "en", scenarios },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[price-check] failed to build scenarios", error);
    return NextResponse.json({ error: "Couldn't build scenarios" }, { status: 500 });
  }
}
