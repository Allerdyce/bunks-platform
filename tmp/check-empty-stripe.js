/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.booking.findMany({
    where: { stripePaymentIntentId: "" },
    select: { id: true, guestName: true, createdAt: true },
  });
  console.log("Bookings with empty stripePaymentIntentId:", rows);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
