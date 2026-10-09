// Guest guide PDFs, per property slug. They live in /private/guides, not /public: they
// contain the address, Wi-Fi and (Steamboat) lock codes. Guests reach them only through a
// signed, per-booking link (lib/guideLinks) served by /api/guides/[slug]/[kind].
export type GuideKind = "guide" | "brochure";

export const PROPERTY_GUIDE_FILES: Record<string, Partial<Record<GuideKind, string>>> = {
  "steamboat-downtown-townhome": {
    guide: "steamboat-welcome-guide.pdf",
    brochure: "steamboat-brochure.pdf",
  },
  "summerland-ocean-view-beach-bungalow": {
    guide: "summerland-guidebook.pdf",
  },
};

// Guides with no lock codes inside, which the Wi-Fi welcome email may link to directly (the
// in-home Wi-Fi page is public, so its guests aren't verified bookers). Steamboat's guides print
// the door codes, so its Wi-Fi guests are sent to their trip page instead.
export const WIFI_SAFE_GUIDE_SLUGS = new Set<string>(["summerland-ocean-view-beach-bungalow"]);

// Early seed data pointed at a guides.bunks.com site that was never built.
const PLACEHOLDER_GUIDE_HOSTS = ["guides.bunks.com", "guestbook.bunks.com"];

export function isPlaceholderGuideUrl(url?: string | null) {
  if (!url) return true;
  return PLACEHOLDER_GUIDE_HOSTS.some((host) => url.includes(host));
}
