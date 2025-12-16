
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const propertySlug = 'steamboat-downtown-townhome';

    const property = await prisma.property.findUnique({
        where: { slug: propertySlug },
    });

    if (!property) {
        console.error(`Property ${propertySlug} not found!`);
        return;
    }

    console.log(`Found property: ${property.name} (ID: ${property.id})`);

    // Clear existing taxes for this property to avoid duplicates during dev
    await prisma.propertyTax.deleteMany({
        where: { propertyId: property.id }
    });

    const tax = await prisma.propertyTax.create({
        data: {
            propertyId: property.id,
            name: 'Steamboat Springs Lodging Tax',
            rate: 0.136, // 13.6%
            appliesTo: ['nightly', 'cleaning']
        }
    });

    console.log('✅ Created Tax Rule:', tax);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
