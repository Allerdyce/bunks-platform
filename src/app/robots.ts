import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bunks.com";
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            // Trip pages and the Wi-Fi page are for guests, not search results.
            disallow: ["/admin/", "/api/", "/my-trips", "/connect/"],
        },
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
