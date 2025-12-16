
import { prisma } from '@/lib/prisma';

async function main() {
    const property = await prisma.property.findFirst({
        where: { name: { contains: 'Steamboat' } },
        select: { id: true, slug: true, pricelabsListingId: true }
    });
    console.log('Property:', property);
}

main().catch(console.error).finally(() => prisma.$disconnect());
