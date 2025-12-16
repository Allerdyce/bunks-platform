
import { prisma } from '@/lib/prisma';

async function main() {
    const sources = await prisma.propertyPricing.groupBy({
        by: ['source'],
        _count: true
    });
    console.log('PropertyPricing Sources:', sources);
}

main().catch(console.error).finally(() => prisma.$disconnect());
