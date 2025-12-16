
import { prisma } from '@/lib/prisma';

async function main() {
    console.log('Deleting CSV-sourced pricing...');
    const result = await prisma.propertyPricing.deleteMany({
        where: {
            source: 'pricelabs-csv'
        }
    });
    console.log(`Deleted ${result.count} records.`);

    const remaining = await prisma.propertyPricing.count();
    console.log(`Remaining records: ${remaining}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
