// prisma/seed.mjs
console.log("🔥 Seed script started");

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const properties = [
    {
      name: 'Summerland Ocean-View Beach Bungalow',
      slug: 'summerland-ocean-view-beach-bungalow',
      airbnbIcalUrl: 'https://www.calendarlabs.com/ical-calendar/ics/76/UK-Holidays.ics', // replace with real iCal
      baseNightlyRate: 40000, // $400.00
      weekdayRate: 37500,
      weekendRate: 42500,
      cleaningFee: 15000,     // $150.00
      serviceFee: 2000,
      maxGuests: 4,
      timezone: 'America/Los_Angeles',
      guestBookUrl: 'https://guestbook.bunks.com/summerland',
      checkInGuideUrl: 'https://guides.bunks.com/summerland/check-in',
      hostSupportEmail: 'ali@bunks.com',
    },
    {
      name: 'Downtown Steamboat Luxury Townhome',
      slug: 'steamboat-downtown-townhome',
      airbnbIcalUrl: "https://www.airbnb.co.uk/calendar/ical/1552191060469626901.ics?s=fbedfa5814315f860dfd24b00e0bd17f",
      baseNightlyRate: 35000, // $350.00 (amounts here are abstract cents)
      weekdayRate: 35000,
      weekendRate: 42000,
      cleaningFee: 18000,     // $180.00
      serviceFee: 2000,
      maxGuests: 6,
      timezone: 'America/Denver',
      guestBookUrl: 'https://guestbook.bunks.com/steamboat',
      checkInGuideUrl: 'https://guides.bunks.com/steamboat/check-in',
      hostSupportEmail: 'ali@bunks.com',
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
      update: property,
      create: property,
    });
    console.log(`✅ Upserted property: ${result.slug}`);
  }

  await prisma.opsContactProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      supportEmail: 'ali@bunks.com',
      supportSmsNumber: '+1 (970) 555-0119',
      opsEmail: 'ops@bunks.com',
      opsPhone: '+1 (970) 555-0124',
      opsDeskPhone: '+1 (970) 555-0101',
      opsDeskHours: '07:00–22:00 MT',
      conciergeName: 'Priya',
      conciergeContact: 'Slack #host-support',
      conciergeNotes: 'Add-on escalations',
      emergencyContact: '911',
      emergencyDetails: 'Share property code 8821',
      doorCodesDocUrl: 'https://bunks.com/?property=steamboat-downtown-townhome/door-codes',
      arrivalNotesUrl: 'https://bunks.com/?property=steamboat-downtown-townhome/arrival-notes',
      liveInstructionsUrl: 'https://bunks.com/?property=steamboat-downtown-townhome/live-instructions',
      recommendationsUrl: 'https://bunks.com/?property=steamboat-downtown-townhome/recommendations',
      guestBookUrl: 'https://bunks.com/?property=steamboat-downtown-townhome/guestbook',
      checkInWindow: 'Check-in after 16:00',
      checkOutTime: 'Checkout by 10:00',
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