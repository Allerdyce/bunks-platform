import { fetchMarketingProperties } from "@/lib/marketingProperties";
import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bunks.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const properties = await fetchMarketingProperties();

    const propertyEntries: MetadataRoute.Sitemap = properties.map((property) => ({
        url: `${BASE_URL}/property/${property.slug}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
    }));

    const staticEntries: MetadataRoute.Sitemap = [
        {
            url: `${BASE_URL}`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        // Add other static pages if desirable (e.g. /login is protected/irrelevant for SEO usually, but maybe /privacy)
        {
            url: `${BASE_URL}/privacy`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
    ];

    return [...staticEntries, ...propertyEntries];
}
