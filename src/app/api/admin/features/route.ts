import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { AIRBNB_RATE_SOURCES, airbnbGuestFee, sourceListingLinked } from "@/lib/airbnbRates";
import {
  FEATURE_FLAG_DEFINITIONS,
  type FeatureFlagKey,
  getFeatureFlags,
  setFeatureFlag,
} from "@/lib/featureFlags";

export const runtime = "nodejs";

// The Airbnb pricing switch only works once AIRBNB_GUEST_FEE_PCT is set, and only for homes whose
// source listing is linked in Admin → Setup; say so next to the switch rather than showing "Live".
async function airbnbPricingStatus(enabled: boolean): Promise<{ active: boolean; note?: string }> {
  if (!enabled) return { active: false };
  const fee = airbnbGuestFee();
  if (fee === null) {
    return {
      active: false,
      note: "Not active yet: AIRBNB_GUEST_FEE_PCT isn't set in Vercel, so prices still come from the rates below.",
    };
  }
  const properties = await prisma.property.findMany({
    where: { slug: { in: Object.keys(AIRBNB_RATE_SOURCES) } },
    select: { slug: true, name: true, airbnbIcalUrl: true },
  });
  const linked = properties.filter((property) => sourceListingLinked(property.slug, property.airbnbIcalUrl));
  const unlinked = properties.filter((property) => !linked.includes(property));
  const needs = unlinked
    .map((property) => `${property.name} needs Airbnb listing ${AIRBNB_RATE_SOURCES[property.slug].listingId} in Admin → Setup`)
    .join("; ");
  const fees = `Airbnb guest fee backed out: ${Math.round(fee * 1000) / 10}%.`;
  if (!linked.length) {
    return { active: false, note: `Not active: no home is linked to its Airbnb listing (${needs}), so prices still come from the rates below.` };
  }
  return {
    active: true,
    note: [
      `Active for ${linked.map((property) => property.name).join(" and ")}. ${fees}`,
      unlinked.length ? `${needs}; until then it stays on the rates below.` : "",
    ].filter(Boolean).join(" "),
  };
}

const formatFeatureList = async (flags: Record<FeatureFlagKey, boolean>) =>
  Promise.all(
    Object.entries(flags).map(async ([key, enabled]) => ({
      key,
      enabled,
      label: FEATURE_FLAG_DEFINITIONS[key as FeatureFlagKey].label,
      description: FEATURE_FLAG_DEFINITIONS[key as FeatureFlagKey].description,
      ...(key === "airbnbPricing" ? await airbnbPricingStatus(enabled) : {}),
    })),
  );

export async function GET(request: NextRequest) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flags = await getFeatureFlags();
  return NextResponse.json({ features: await formatFeatureList(flags) });
}

export async function POST(request: NextRequest) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { key?: string; enabled?: unknown };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { key, enabled } = payload;

  if (!key || typeof key !== "string") {
    return NextResponse.json({ error: "Feature key is required" }, { status: 400 });
  }

  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Field 'enabled' must be a boolean" }, { status: 400 });
  }

  if (!(key in FEATURE_FLAG_DEFINITIONS)) {
    return NextResponse.json({ error: "Unknown feature key" }, { status: 400 });
  }

  const updatedFlags = await setFeatureFlag(key as FeatureFlagKey, enabled);
  return NextResponse.json({ features: await formatFeatureList(updatedFlags) });
}
