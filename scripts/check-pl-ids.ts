import { prisma } from '../src/lib/prisma';
async function main() {
  const props = await prisma.property.findMany({ select: { id: true, name: true, pricelabsListingId: true } });
  console.log(JSON.stringify(props, null, 2));
}
main();
