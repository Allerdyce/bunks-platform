// Guest guide PDFs (in /public), per property slug.
// `guide` is what guests open from their trip page, emails and the Wi-Fi page;
// `afterWifi` is shown on the Wi-Fi success screen.
export const PROPERTY_GUIDES: Record<string, { guide: string; afterWifi: string }> = {
  "steamboat-downtown-townhome": {
    guide: "/Steamboat%20Welcome%20Guide.pdf",
    afterWifi: "/Steamboat%20Brochure.pdf",
  },
  "summerland-ocean-view-beach-bungalow": {
    guide: "/Lillie%20Guidebook.pdf",
    afterWifi: "/Lillie%20Guidebook.pdf",
  },
};

// Early seed data pointed at a guides.bunks.com site that was never built.
const PLACEHOLDER_GUIDE_HOSTS = ["guides.bunks.com", "guestbook.bunks.com"];

export function isPlaceholderGuideUrl(url?: string | null) {
  if (!url) return true;
  return PLACEHOLDER_GUIDE_HOSTS.some((host) => url.includes(host));
}

/** A real guide link for the property: its PDF, else a stored URL that isn't a placeholder. */
export function guideUrlFor(slug: string, ...storedUrls: Array<string | null | undefined>) {
  const pdf = PROPERTY_GUIDES[slug]?.guide;
  if (pdf) return pdf;
  return storedUrls.find((url) => !isPlaceholderGuideUrl(url)) ?? null;
}
