// prisma/seed.mjs
console.log("🔥 Seed script started");

import { PrismaClient } from '@prisma/client';

// The seed deletes unknown properties (and their bookings) and creates placeholder data, so it
// only runs against a local database unless explicitly allowed.
const databaseUrl = process.env.DATABASE_URL ?? '';
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl) && process.env.SEED_ALLOW_REMOTE !== 'true') {
  console.error('Refusing to seed a non-local database. Set SEED_ALLOW_REMOTE=true if you really mean it.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const properties = [
    {
      name: 'Summerland Ocean-View Beach Bungalow',
      slug: 'summerland-ocean-view-beach-bungalow',
      airbnbIcalUrl: '', // set the real Airbnb link in Admin → Setup (never commit it)
      baseNightlyRate: 40000, // $400.00
      weekdayRate: 37500,
      weekendRate: 42500,
      cleaningFee: 15000,     // $150.00
      serviceFee: 2000,
      maxGuests: 4,
      timezone: 'America/Los_Angeles',
      guestBookUrl: 'https://guestbook.bunks.com/summerland',
      checkInGuideUrl: 'https://guides.bunks.com/summerland/check-in',
      hostSupportEmail: 'alissa@bunks.com',
    },
    {
      name: 'Downtown Steamboat Luxury Townhome',
      slug: 'steamboat-downtown-townhome',
      airbnbIcalUrl: '', // set the real Airbnb link in Admin → Setup (never commit it)
      baseNightlyRate: 35000, // $350.00 (amounts here are abstract cents)
      weekdayRate: 35000,
      weekendRate: 42000,
      cleaningFee: 18000,     // $180.00
      serviceFee: 2000,
      maxGuests: 6,
      timezone: 'America/Denver',
      guestBookUrl: 'https://guestbook.bunks.com/steamboat',
      checkInGuideUrl: 'https://guides.bunks.com/steamboat/check-in',
      hostSupportEmail: 'alissa@bunks.com',
    },
  ];

  const activeSlugs = properties.map((property) => property.slug);

  const obsoleteProperties = await prisma.property.findMany({
    where: { slug: { notIn: activeSlugs } },
    select: { id: true, slug: true },
  });

  if (obsoleteProperties.length) {
    const obsoleteIds = obsoleteProperties.map((property) => property.id);
    console.log(`🧹 Removing ${obsoleteIds.length} inactive properties`);

    await prisma.specialRate.deleteMany({ where: { propertyId: { in: obsoleteIds } } });
    await prisma.blockedDate.deleteMany({ where: { propertyId: { in: obsoleteIds } } });
    await prisma.booking.deleteMany({ where: { propertyId: { in: obsoleteIds } } });
    await prisma.property.deleteMany({ where: { id: { in: obsoleteIds } } });
  }

  for (const property of properties) {
    const result = await prisma.property.upsert({
      where: { slug: property.slug },
      // Only fill in missing homes; never overwrite settings edited in Admin.
      update: {},
      create: property,
    });
    console.log(`✅ Upserted property: ${result.slug}`);
  }

  // Real contact details are entered in Admin → Details; never seed fake phone numbers or names.
  await prisma.opsContactProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      supportEmail: 'alissa@bunks.com',
      supportSmsNumber: '',
      opsEmail: 'alissa@bunks.com',
      opsPhone: '',
      emergencyContact: '911',
    },
  });

  console.log('✅ Seeded ops contact profile');

  await prisma.featureToggle.upsert({
    where: { key: 'addons' },
    update: {},
    create: {
      key: 'addons',
      enabled: true,
    },
  });

  console.log('✅ Ensured feature toggles');

  console.log('✅ Finished seeding properties');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });