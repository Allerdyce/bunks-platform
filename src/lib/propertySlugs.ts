// Short property paths (/property/summerland) are what the site puts in the address bar, and
// they're printed on marketing material. Everywhere else (database, sitemap, cards) uses the
// full slug, so pages resolve the short path to it before looking the property up.
const PATH_TO_CANONICAL_SLUG = new Map([
  ["steamboat", "steamboat-downtown-townhome"],
  ["summerland", "summerland-ocean-view-beach-bungalow"],
]);

const CANONICAL_TO_PATH_SLUG = new Map(
  [...PATH_TO_CANONICAL_SLUG].map(([pathSlug, canonicalSlug]) => [canonicalSlug, pathSlug]),
);

export const getCanonicalSlugFromPath = (slug: string) => PATH_TO_CANONICAL_SLUG.get(slug) ?? slug;

export const getPathSlugFromCanonical = (slug: string) => CANONICAL_TO_PATH_SLUG.get(slug) ?? slug;
