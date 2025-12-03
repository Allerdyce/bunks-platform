import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/adminAuth";
import {
  FEATURE_FLAG_DEFINITIONS,
  type FeatureFlagKey,
  getFeatureFlags,
  setFeatureFlag,
} from "@/lib/featureFlags";

export const runtime = "nodejs";

const formatFeatureList = (flags: Record<FeatureFlagKey, boolean>) =>
  Object.entries(flags).map(([key, enabled]) => ({
    key,
    enabled,
    label: FEATURE_FLAG_DEFINITIONS[key as FeatureFlagKey].label,
    description: FEATURE_FLAG_DEFINITIONS[key as FeatureFlagKey].description,
  }));

export async function GET(request: NextRequest) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flags = await getFeatureFlags();
  return NextResponse.json({ features: formatFeatureList(flags) });
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
  return NextResponse.json({ features: formatFeatureList(updatedFlags) });
}
