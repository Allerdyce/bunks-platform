
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Checking PropertyPricing table for PriceLabs data...');

    const count = await prisma.propertyPricing.count();
    console.log(`Total pricing records: ${count}`);

    if (count > 0) {
        const latest = await prisma.propertyPricing.findFirst({
            orderBy: { updatedAt: 'desc' },
            include: { property: true }
        });

        console.log('Latest sync record:');
        console.log(JSON.stringify(latest, null, 2));

        // Check specific property stats
        const property = await prisma.property.findFirst({
            where: { slug: 'steamboat-downtown-townhome' }
        });

        if (property) {
            const propCount = await prisma.propertyPricing.count({
                where: { propertyId: property.id }
            });
            console.log(`Steamboat records: ${propCount}`);
        }

    } else {
        console.log('No pricing data found yet.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
