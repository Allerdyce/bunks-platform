import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionFromRequest } from "@/lib/adminAuth";
import { PROPERTIES } from "@/data/properties";

export const runtime = "nodejs";

const TRANSIENT_ERROR_PATTERN = /(Closed|ECONNRESET|P1001|P1008|timed out)/i;
const SLUG_ALIASES: Record<string, string> = {
  "2211-lillie-avenue-cottage": "summerland-ocean-view-beach-bungalow",
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchPropertiesWithRetry = async (retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await prisma.property.findMany({
        orderBy: { name: "asc" },
        include: {
          specialRates: {
            orderBy: { date: "asc" },
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isTransient = TRANSIENT_ERROR_PATTERN.test(message);
      if (attempt === retries || !isTransient) {
        throw error;
      }
      await delay(200 * (attempt + 1));
    }
  }

  return [];
};

export async function GET(request: NextRequest) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const propertyNameMap = new Map(PROPERTIES.map((property) => [property.slug, property.name] as const));
    const properties = await fetchPropertiesWithRetry();

    const payload = properties.map((property) => {
      const canonicalSlug = SLUG_ALIASES[property.slug] ?? property.slug;
      const typedProperty = property as typeof property & {
        weekdayRate?: number | null;
        weekendRate?: number | null;
        serviceFee?: number | null;
      };

      return {
        id: property.id,
        name: propertyNameMap.get(canonicalSlug) ?? propertyNameMap.get(property.slug) ?? property.name,
        slug: property.slug,
        weekdayRate: typedProperty.weekdayRate ?? property.baseNightlyRate,
        weekendRate: typedProperty.weekendRate ?? property.baseNightlyRate,
        cleaningFee: property.cleaningFee,
        serviceFee: typedProperty.serviceFee ?? 2000,
        currency: "USD",
        specialRates: property.specialRates.map((rate) => ({
          id: rate.id,
          date: rate.date.toISOString().split("T")[0],
          price: rate.price,
          note: rate.note,
          isBlocked: rate.isBlocked,
        })),
        pricelabsListingId: property.pricelabsListingId,
      };
    });

    return NextResponse.json({ properties: payload });
  } catch (error) {
    console.error("Failed to load admin properties", error);
    return NextResponse.json({ error: "Unable to load properties" }, { status: 500 });
  }
}
