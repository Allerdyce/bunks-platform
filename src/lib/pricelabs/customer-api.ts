
import { z } from "zod";

const BASE_URL = "https://api.pricelabs.co/v1";

// Response Schema for type safety
const PriceDataSchema = z.object({
    date: z.string(),
    price: z.number(),
    min_stay: z.number(),
    booking_status: z.string(), // "Booked", "Reserved", "Available"
    unbookable: z.number().optional(), // 0 or 1
    demand_desc: z.string().optional()
});

const ListingResponseSchema = z.object({
    id: z.string(),
    pms: z.string(),
    data: z.array(PriceDataSchema)
});

const ApiResponseSchema = z.array(ListingResponseSchema);

export type PriceLabsPriceData = z.infer<typeof PriceDataSchema>;

export class PriceLabsCustomerApiClient {
    private apiKey: string;

    constructor() {
        const key = process.env.PRICELABS_API_KEY;
        if (!key) throw new Error("PRICELABS_API_KEY is not defined");
        this.apiKey = key;
    }

    /**
     * Fetches pricing recommendations for a specific listing.
     * Note: "bunks" internal listing ID vs PriceLabs "listing_id".
     * You must provide the PriceLabs listing ID (e.g. "1552191060469626901")
     */
    async getListingPrices(listingId: string): Promise<PriceLabsPriceData[]> {
        const url = `${BASE_URL}/listing_prices?api_key=${this.apiKey}`;

        const payload = {
            listings: [
                { id: listingId, pms: "airbnb" }
            ]
        };

        console.log(`[PriceLabsClient] Fetching prices for ${listingId}...`);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`PriceLabs API Error: ${response.status} - ${text}`);
        }

        const json = await response.json();

        // Validation
        const result = ApiResponseSchema.safeParse(json);
        if (!result.success) {
            console.error("Schema Validation Failed", result.error);
            // Fallback: Check if it's the error format {"error": ...}
            if ('error' in json && typeof json.error === 'string') {
                throw new Error(`PriceLabs Logic Error: ${json.error} - ${json.desc}`);
            }
            throw new Error("Invalid Response Format from PriceLabs");
        }

        const listingData = result.data.find(l => l.id === listingId);
        if (!listingData) {
            throw new Error(`Listing ${listingId} not found in response`);
        }

        return listingData.data;
    }
}
