import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureTestAddon(propertyId: number) {
  const existing = await prisma.addon.findFirst({ where: { propertyId } });
  if (existing) {
    return existing;
  }

  return prisma.addon.create({
    data: {
      propertyId,
      slug: `test-addon-${Date.now()}`,
      title: "Test Add-On",
      description: "Temporary add-on for cascade test",
      category: "Test",
      provider: "Test Provider",
      basePriceCents: 1000,
      currency: "USD",
    },
  });
}

async function main() {
  const property = await prisma.property.findFirst();
  if (!property) {
    throw new Error("No property found to run test");
  }

  const addon = await ensureTestAddon(property.id);

  const booking = await prisma.booking.create({
    data: {
      propertyId: property.id,
      checkInDate: new Date("2025-12-20T00:00:00Z"),
      checkOutDate: new Date("2025-12-22T00:00:00Z"),
      guestName: "Cascade Test",
      guestEmail: "cascade-test@example.com",
      totalPriceCents: 50000,
      stripePaymentIntentId: `pi_test_${Date.now()}`,
    },
  });

  await prisma.bookingAddon.create({
    data: {
      bookingId: booking.id,
      addonId: addon.id,
      finalPriceCents: addon.basePriceCents,
      providerStatus: "pending-provider",
      activityDate: new Date("2025-12-21T00:00:00Z"),
      activityTimeSlot: "16:00",
    },
  });

  console.log(`Created booking ${booking.id} with addon ${addon.id}`);

  await prisma.booking.delete({ where: { id: booking.id } });

  const orphanAddons = await prisma.bookingAddon.findMany({ where: { bookingId: booking.id } });
  console.log(`Remaining booking-addon rows for booking ${booking.id}:`, orphanAddons.length);
}

main()
  .catch((error) => {
    console.error("Cascade test failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
