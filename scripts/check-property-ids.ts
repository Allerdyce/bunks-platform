
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const properties = await prisma.property.findMany({
        select: { id: true, name: true, slug: true, pricelabsListingId: true }
    });
    console.log("Properties:", JSON.stringify(properties, null, 2));
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
