import { prisma } from '@/lib/prisma';
async function main() {
    const p = await prisma.property.findFirst({ where: { pricelabsListingId: 'steamboat-downtown-townhome' } });
    if (!p) {
        console.log("Property not found");
        return;
    }
    const pricing = await prisma.propertyPricing.findFirst({
        where: { propertyId: p.id, date: new Date('2025-12-25') }
    });
    console.log(JSON.stringify(pricing, null, 2));
}
main();
