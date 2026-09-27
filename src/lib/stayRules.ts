// Minimum nights per property. Shared by the booking API and the calendar feed.
const PROPERTY_MINIMUM_NIGHTS: Record<string, number> = {
  'summerland-ocean-view-beach-bungalow': 3,
  'steamboat-downtown-townhome': 3,
};

export const DEFAULT_MINIMUM_NIGHTS = 1;

export function minimumNightsFor(slug: string) {
  return PROPERTY_MINIMUM_NIGHTS[slug] ?? DEFAULT_MINIMUM_NIGHTS;
}
