import { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
    const BASE_URL = getAppBaseUrl();
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            // Trip pages, the Wi-Fi page and private payment links are for guests, not search results.
            disallow: ["/admin/", "/api/", "/my-trips", "/connect/", "/pay/"],
        },
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
