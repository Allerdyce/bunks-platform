import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AddonSeed {
  slug: string;
  propertySlug: string;
  title: string;
  description: string;
  category: string;
  provider: 'viator';
  providerProductId: string;
  basePriceCents: number;
  durationMinutes?: number | null;
  imageUrl?: string;
}

const ADDON_CATALOG: AddonSeed[] = [
  {
    slug: 'sb_beach_picnic',
    propertySlug: 'summerland-ocean-view-beach-bungalow',
    title: 'Luxury Beach Picnic Experience',
    description:
      'Designer décor, locally sourced food boards, sparkling beverages, florals, umbrellas, and a sunset-ready setup right on the Santa Barbara coastline.',
    category: 'Special Occasion',
    provider: 'viator',
    providerProductId: 'viator_sb_beach_picnic',
    basePriceCents: 45000,
    durationMinutes: 120,
    imageUrl: '/2211-lillie-ave/living-room/living-room-1.webp',
  },
  {
    slug: 'sb_private_wine_tour',
    propertySlug: 'summerland-ocean-view-beach-bungalow',
    title: 'Private Santa Ynez Wine Tour',
    description:
      'Chauffeured tastings at prestige Santa Ynez Valley wineries with vineyard access and gourmet lunch.',
    category: 'Wine & Lifestyle',
    provider: 'viator',
    providerProductId: 'viator_sb_private_wine_tour',
    basePriceCents: 65000,
    durationMinutes: 300,
    imageUrl: '/2211-lillie-ave/kitchen/kitchen-1.webp',
  },
  {
    slug: 'sb_sunset_yacht',
    propertySlug: 'summerland-ocean-view-beach-bungalow',
    title: 'Sunset Private Yacht Cruise',
    description:
      'Charter a private yacht with captain for a champagne sunset cruise along the American Riviera.',
    category: 'Luxury',
    provider: 'viator',
    providerProductId: 'viator_sb_sunset_yacht',
    basePriceCents: 85000,
    durationMinutes: 90,
    imageUrl: '/2211-lillie-ave/exterior/exterior-1.webp',
  },
  {
    slug: 'sb_private_chef',
    propertySlug: 'summerland-ocean-view-beach-bungalow',
    title: 'Private Chef Dining Experience',
    description:
      'Multi-course farm-to-table dinner prepared in-home by a dedicated private chef.',
    category: 'Culinary',
    provider: 'viator',
    providerProductId: 'viator_sb_private_chef',
    basePriceCents: 30000,
    durationMinutes: 150,
    imageUrl: '/2211-lillie-ave/kitchen/kitchen-2.webp',
  },
  {
    slug: 'sb_beach_horseback',
    propertySlug: 'summerland-ocean-view-beach-bungalow',
    title: 'Beach Horseback Riding',
    description: 'Guided private horseback ride along Summerland’s iconic coastline.',
    category: 'Adventure',
    provider: 'viator',
    providerProductId: 'viator_sb_beach_horseback',
    basePriceCents: 25000,
    durationMinutes: 90,
    imageUrl: '/2211-lillie-ave/exterior/exterior-2.webp',
  },
  {
    slug: 'sb_five_star_spa',
    propertySlug: 'summerland-ocean-view-beach-bungalow',
    title: 'Five-Star Spa Day',
    description: 'Massage and facial package at a Forbes Five-Star Montecito resort.',
    category: 'Wellness',
    provider: 'viator',
    providerProductId: 'viator_sb_five_star_spa',
    basePriceCents: 50000,
    durationMinutes: 120,
    imageUrl: '/2211-lillie-ave/bathrooms/bathrooms-1.webp',
  },
  {
    slug: 'ss_snowcat_adventure',
    propertySlug: 'steamboat-downtown-townhome',
    title: 'Private Snowcat Skiing Adventure',
    description: 'Guided backcountry powder day with Steamboat’s premier snowcat outfit.',
    category: 'Adventure',
    provider: 'viator',
    providerProductId: 'viator_ss_snowcat_adventure',
    basePriceCents: 120000,
    durationMinutes: 480,
    imageUrl: '/steamboat-pictures/additional/additional-1.jpg',
  },
  {
    slug: 'ss_snowmobile_expedition',
    propertySlug: 'steamboat-downtown-townhome',
    title: 'Luxury Snowmobile Expedition',
    description: 'Exclusive snowmobile tour on a private mountain with full gear and shuttle.',
    category: 'Adventure',
    provider: 'viator',
    providerProductId: 'viator_ss_snowmobile_expedition',
    basePriceCents: 90000,
    durationMinutes: 180,
    imageUrl: '/steamboat-pictures/additional/additional-2.jpg',
  },
  {
    slug: 'ss_hot_air_balloon',
    propertySlug: 'steamboat-downtown-townhome',
    title: 'Sunrise Hot-Air Balloon Ride',
    description: 'Sunrise flight over Yampa Valley followed by champagne toast.',
    category: 'Scenic',
    provider: 'viator',
    providerProductId: 'viator_steamboat_balloon_001',
    basePriceCents: 35000,
    durationMinutes: 120,
    imageUrl: '/steamboat-pictures/additional/additional-3.jpg',
  },
  {
    slug: 'ss_sleigh_cabin_dinner',
    propertySlug: 'steamboat-downtown-townhome',
    title: 'Horse-Drawn Sleigh Ride + Cabin Dinner',
    description: 'Scenic sleigh ride through snowy ranchland capped with a gourmet steakhouse dinner.',
    category: 'Romantic',
    provider: 'viator',
    providerProductId: 'viator_ss_sleigh_cabin_dinner',
    basePriceCents: 60000,
    durationMinutes: 120,
    imageUrl: '/steamboat-pictures/additional/additional-4.jpg',
  },
  {
    slug: 'ss_private_chef',
    propertySlug: 'steamboat-downtown-townhome',
    title: 'Private Chef Dinner (Steamboat)',
    description: 'In-home gourmet dining by a Steamboat chef, including grocery sourcing and cleanup.',
    category: 'Culinary',
    provider: 'viator',
    providerProductId: 'viator_ss_private_chef',
    basePriceCents: 30000,
    durationMinutes: 150,
    imageUrl: '/steamboat-pictures/kitchen/kitchen-1.jpg',
  },
  {
    slug: 'ss_hot_springs_massage',
    propertySlug: 'steamboat-downtown-townhome',
    title: 'Hot Springs + Massage Package',
    description: 'Strawberry Park hot springs access paired with an on-site massage session.',
    category: 'Wellness',
    provider: 'viator',
    providerProductId: 'viator_ss_hot_springs_massage',
    basePriceCents: 28000,
    durationMinutes: null,
    imageUrl: '/steamboat-pictures/exterior/exterior-1.jpg',
  },
];

async function main() {
  const activeSlugs = ADDON_CATALOG.map((addon) => addon.slug);

  const staleAddons = await prisma.addon.findMany({
    where: { slug: { notIn: activeSlugs } },
    select: { id: true },
  });

  if (staleAddons.length) {
    const staleIds = staleAddons.map((addon) => addon.id);
    await prisma.bookingAddon.deleteMany({ where: { addonId: { in: staleIds } } });
    await prisma.addon.deleteMany({ where: { id: { in: staleIds } } });
  }

  for (const addon of ADDON_CATALOG) {
    const property = await prisma.property.findUnique({
      where: { slug: addon.propertySlug },
      select: { id: true },
    });

    if (!property) {
      throw new Error(`Property with slug "${addon.propertySlug}" not found`);
    }

    await prisma.addon.upsert({
      where: { slug: addon.slug },
      update: {
        propertyId: property.id,
        title: addon.title,
        description: addon.description,
        category: addon.category,
        provider: addon.provider,
        providerProductId: addon.providerProductId,
        basePriceCents: addon.basePriceCents,
        durationMinutes: addon.durationMinutes ?? null,
        imageUrl: addon.imageUrl,
        isActive: true,
      },
      create: {
        slug: addon.slug,
        propertyId: property.id,
        title: addon.title,
        description: addon.description,
        category: addon.category,
        provider: addon.provider,
        providerProductId: addon.providerProductId,
        basePriceCents: addon.basePriceCents,
        durationMinutes: addon.durationMinutes ?? null,
        imageUrl: addon.imageUrl,
      },
    });
  }

  console.log(`Seeded ${ADDON_CATALOG.length} add-ons across both properties.`);
}

main()
  .catch((error) => {
    console.error('Failed to seed add-ons', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
