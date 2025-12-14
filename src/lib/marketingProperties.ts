import "server-only";

import type { Property as PrismaProperty } from "@prisma/client";
import type { Property } from "@/types";
import { prisma } from "@/lib/prisma";
import { PROPERTIES } from "@/data/properties";

type DbProperty = Pick<
  PrismaProperty,
  |
    "id"
    | "slug"
    | "name"
    | "maxGuests"
    | "baseNightlyRate"
    | "weekdayRate"
    | "weekendRate"
    | "cleaningFee"
    | "serviceFee"
    | "checkInTime"
    | "checkOutTime"
    | "wifiSsid"
    | "wifiPassword"
    | "garageCode"
    | "lockboxCode"
    | "skiLockerDoorCode"
    | "skiLockerNumber"
    | "skiLockerCode"
    | "quietHours"
    | "parkingNotes"
    | "houseRules"
    | "emergencyContacts"
>;

const centsToDollars = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? value / 100 : undefined;

const coerceStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return undefined;
  const result = value.filter((entry): entry is string => typeof entry === "string");
  return result.length ? result : undefined;
};

type EmergencyContact = { name: string; phone: string; role?: string };

const coerceEmergencyContacts = (
  value: unknown,
): NonNullable<Property["emergencyContacts"]> | undefined => {
  if (!Array.isArray(value)) return undefined;
  const entries = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const maybe = entry as { name?: unknown; phone?: unknown; role?: unknown };
      if (typeof maybe.name !== "string" || typeof maybe.phone !== "string") {
        return null;
      }
      const contact: EmergencyContact = {
        name: maybe.name,
        phone: maybe.phone,
      };
      if (typeof maybe.role === "string" && maybe.role.trim()) {
        contact.role = maybe.role;
      }
      return contact;
    })
    .filter((entry): entry is EmergencyContact => Boolean(entry));
  return entries.length ? entries : undefined;
};

const mergeProperty = (marketing: Property, dbProperty: DbProperty): Property => {
  const nightlyRateCents = dbProperty.weekdayRate ?? dbProperty.baseNightlyRate;
  const nightlyRate = centsToDollars(nightlyRateCents);
  const merged: Property = {
    ...marketing,
    id: dbProperty.id ?? marketing.id,
    name: dbProperty.name ?? marketing.name,
    slug: dbProperty.slug ?? marketing.slug,
    guests: dbProperty.maxGuests ?? marketing.guests,
    price: nightlyRate ?? marketing.price,
    weekdayRate: centsToDollars(dbProperty.weekdayRate) ?? marketing.weekdayRate,
    weekendRate: centsToDollars(dbProperty.weekendRate) ?? marketing.weekendRate,
    cleaningFee: centsToDollars(dbProperty.cleaningFee) ?? marketing.cleaningFee,
    serviceFee: centsToDollars(dbProperty.serviceFee) ?? marketing.serviceFee,
    checkInTime: marketing.checkInTime ?? dbProperty.checkInTime ?? undefined,
    checkOutTime: marketing.checkOutTime ?? dbProperty.checkOutTime ?? undefined,
    wifiSsid: marketing.wifiSsid ?? dbProperty.wifiSsid ?? undefined,
    wifiPassword: marketing.wifiPassword ?? dbProperty.wifiPassword ?? undefined,
    garageCode: marketing.garageCode ?? dbProperty.garageCode ?? undefined,
    lockboxCode: marketing.lockboxCode ?? dbProperty.lockboxCode ?? undefined,
    skiLockerDoorCode: marketing.skiLockerDoorCode ?? dbProperty.skiLockerDoorCode ?? undefined,
    skiLockerNumber: marketing.skiLockerNumber ?? dbProperty.skiLockerNumber ?? undefined,
    skiLockerCode: marketing.skiLockerCode ?? dbProperty.skiLockerCode ?? undefined,
    quietHours: marketing.quietHours ?? dbProperty.quietHours ?? undefined,
    parkingNotes: marketing.parkingNotes ?? dbProperty.parkingNotes ?? undefined,
    houseRules: marketing.houseRules ?? coerceStringArray(dbProperty.houseRules),
    emergencyContacts: marketing.emergencyContacts ?? coerceEmergencyContacts(dbProperty.emergencyContacts),
  };

  return merged;
};

const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes for successful hydrations
const FALLBACK_TTL_MS = 1000 * 30; // retry every 30 seconds when Prisma fails
const DB_TIMEOUT_MS = Number(process.env.MARKETING_DB_TIMEOUT_MS ?? "4000");
const MARKETING_DB_DISABLED = process.env.MARKETING_DB_DISABLED === "true";

let cachedProperties: Property[] | null = null;
let cacheExpiresAt = 0;
let inFlightPromise: Promise<Property[]> | null = null;
let lastErrorMessage: string | null = null;
let lastErrorLoggedAt = 0;
const ERROR_LOG_THROTTLE_MS = 60_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise;
  }
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

const propertySelect = {
  id: true,
  slug: true,
  name: true,
  maxGuests: true,
  baseNightlyRate: true,
  weekdayRate: true,
  weekendRate: true,
  cleaningFee: true,
  serviceFee: true,
  checkInTime: true,
  checkOutTime: true,
  wifiSsid: true,
  wifiPassword: true,
  garageCode: true,
  lockboxCode: true,
  skiLockerDoorCode: true,
  skiLockerNumber: true,
  skiLockerCode: true,
  quietHours: true,
  parkingNotes: true,
  houseRules: true,
  emergencyContacts: true,
};

async function hydrateFromDatabase(): Promise<Property[]> {
  if (MARKETING_DB_DISABLED) {
    return PROPERTIES;
  }

  const dbProperties = await withTimeout(prisma.property.findMany({ select: propertySelect }), DB_TIMEOUT_MS);
  const dbMap = new Map(dbProperties.map((property) => [property.slug, property] as const));
  const hydrated = PROPERTIES.map((property) => {
    const dbProperty = dbMap.get(property.slug);
    if (!dbProperty) {
      return property;
    }
    return mergeProperty(property, dbProperty as DbProperty);
  });
  return hydrated;
}

function logHydrationWarning(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown error while hydrating marketing properties";
  const now = Date.now();
  if (message === lastErrorMessage && now - lastErrorLoggedAt < ERROR_LOG_THROTTLE_MS) {
    return;
  }
  lastErrorMessage = message;
  lastErrorLoggedAt = now;
  console.warn(`[marketingProperties] Falling back to static data: ${message}`);
}

async function resolveProperties(): Promise<Property[]> {
  try {
    const hydrated = await hydrateFromDatabase();
    cachedProperties = hydrated;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return hydrated;
  } catch (error) {
    logHydrationWarning(error);
    cachedProperties = PROPERTIES;
    cacheExpiresAt = Date.now() + FALLBACK_TTL_MS;
    return PROPERTIES;
  }
}

export async function fetchMarketingProperties(): Promise<Property[]> {
  const now = Date.now();
  if (cachedProperties && now < cacheExpiresAt) {
    return cachedProperties;
  }

  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = resolveProperties().finally(() => {
    inFlightPromise = null;
  });

  return inFlightPromise;
}
