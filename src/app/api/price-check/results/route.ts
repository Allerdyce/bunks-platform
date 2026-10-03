import { NextResponse } from "next/server";
import {
  alertOnComparisons,
  applyAutoRates,
  compareQuotes,
  isAuthorizedPriceCheckRequest,
  minSavingsPct,
  recordResultsReceived,
  validateQuote,
  type IncomingQuote,
} from "@/lib/priceCheck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2_000_000;
const MAX_QUOTES = 100;

/** Airbnb quotes from the price runner: compare with Bunks' prices and alert (see lib/priceCheck). */
export async function POST(request: Request) {
  if (!isAuthorizedPriceCheckRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Body too large" }, { status: 413 });
  }
  let body: { runId?: unknown; quotes?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body?.runId !== "string" || !Array.isArray(body.quotes) || body.quotes.length > MAX_QUOTES) {
    return NextResponse.json({ error: `Expected runId and up to ${MAX_QUOTES} quotes` }, { status: 400 });
  }
  const quotes = body.quotes.map(validateQuote);
  if (quotes.some((quote) => !quote)) {
    return NextResponse.json({ error: "One or more quotes are malformed" }, { status: 400 });
  }

  try {
    // Any well-formed report counts as the runner being alive, even if every quote failed:
    // the failures are alerted on below.
    await recordResultsReceived();
    // Airbnb is the rule: save the nightly rates first, so the comparison shows the new prices.
    const rateUpdates = await applyAutoRates(quotes as IncomingQuote[]);
    const comparisons = await compareQuotes(quotes as IncomingQuote[]);
    const alerted = await alertOnComparisons(comparisons, rateUpdates);
    return NextResponse.json({ runId: body.runId, targetSavingsPct: minSavingsPct(), alerted, rateUpdates, comparisons });
  } catch (error) {
    console.error("[price-check] failed to compare results", error);
    return NextResponse.json({ error: "Couldn't compare results" }, { status: 500 });
  }
}
