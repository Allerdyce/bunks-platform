import { prisma } from "@/lib/prisma";

export const FEATURE_FLAG_DEFINITIONS = {

  automatedEmails: {
    label: "Automated guest + host emails",
    description: "Send scheduled reminders, checkout nudges, and host prep digests when enabled.",
  },
  airbnbPricing: {
    label: "Price homes from Airbnb",
    description:
      "Nightly rates copied from each home's Airbnb listing twice a day; Bunks charges 10% less. Turn off to use the rates below instead.",
  },
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAG_DEFINITIONS;

export type FeatureFlagMap = Record<FeatureFlagKey, boolean>;

const FEATURE_FLAG_DEFAULTS: FeatureFlagMap = {

  automatedEmails: true,
  airbnbPricing: true,
};

// Each server instance (and route bundle) caches flags separately; QA sets FEATURE_FLAG_CACHE_MS=0.
const CACHE_TTL_MS = Number(process.env.FEATURE_FLAG_CACHE_MS ?? 30_000);
let cachedFlags: FeatureFlagMap | null = null;
let cacheExpiresAt = 0;

function mergeWithDefaults(partial: Partial<Record<FeatureFlagKey, boolean>>): FeatureFlagMap {
  return Object.keys(FEATURE_FLAG_DEFAULTS).reduce((result, key) => {
    const typedKey = key as FeatureFlagKey;
    result[typedKey] = partial[typedKey] ?? FEATURE_FLAG_DEFAULTS[typedKey];
    return result;
  }, {} as FeatureFlagMap);
}

async function loadFlagsFromDatabase(): Promise<FeatureFlagMap> {
  const rows = await prisma.featureToggle.findMany({
    select: { key: true, enabled: true },
  });

  const map = rows.reduce<Partial<Record<FeatureFlagKey, boolean>>>((acc, row) => {
    if ((row.key as FeatureFlagKey) in FEATURE_FLAG_DEFAULTS) {
      acc[row.key as FeatureFlagKey] = row.enabled;
    }
    return acc;
  }, {});

  return mergeWithDefaults(map);
}

export async function getFeatureFlags(): Promise<FeatureFlagMap> {
  const now = Date.now();
  if (cachedFlags && cacheExpiresAt > now) {
    return cachedFlags;
  }

  const flags = await loadFlagsFromDatabase();
  cachedFlags = flags;
  cacheExpiresAt = now + CACHE_TTL_MS;
  return flags;
}

export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[key];
}

export async function ensureFeatureEnabled(key: FeatureFlagKey): Promise<void> {
  const enabled = await isFeatureEnabled(key);
  if (!enabled) {
    throw new Error(`Feature flag "${key}" is disabled`);
  }
}

export async function setFeatureFlag(key: FeatureFlagKey, enabled: boolean): Promise<FeatureFlagMap> {
  await prisma.featureToggle.upsert({
    where: { key },
    update: { enabled },
    create: { key, enabled },
  });
  invalidateFeatureFlagCache();
  return getFeatureFlags();
}

export function invalidateFeatureFlagCache() {
  cachedFlags = null;
  cacheExpiresAt = 0;
}

export function getFeatureFlagMetadata() {
  return FEATURE_FLAG_DEFINITIONS;
}
