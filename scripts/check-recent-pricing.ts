
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const tenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    console.log(`Checking for pricing updates since ${tenMinutesAgo.toISOString()}...`);

    const count = await prisma.propertyPricing.count({
        where: {
            updatedAt: {
                gte: tenMinutesAgo,
            },
        },
    });

    console.log(`Found ${count} updated pricing records.`);

    if (count > 0) {
        const sample = await prisma.propertyPricing.findFirst({
            where: {
                updatedAt: {
                    gte: tenMinutesAgo,
                },
            },
            include: {
                property: {
                    select: { name: true, slug: true }
                }
            }
        });
        console.log("Sample Record:", JSON.stringify(sample, null, 2));
    } else {
        // Check total count just in case
        const total = await prisma.propertyPricing.count();
        console.log(`Total pricing records in DB: ${total}`);

        // Check most recent
        const latest = await prisma.propertyPricing.findFirst({
            orderBy: { updatedAt: 'desc' }
        });
        console.log("Most recent record:", latest);
    }
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
