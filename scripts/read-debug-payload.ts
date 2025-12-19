
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const debugRecord = await prisma.propertyPricing.findUnique({
        where: {
            propertyId_date: {
                propertyId: 11,
                date: new Date('2099-01-01T00:00:00Z')
            }
        }
    });

    if (debugRecord) {
        console.log("!!! TRAP ACTIVATED !!!");
        console.log("Source Field:", debugRecord.source);
        console.log("Updated At:", debugRecord.updatedAt.toISOString());
    } else {
        console.log("... Trap Empty. No debug record found for 2099-01-01 ...");
    }
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
