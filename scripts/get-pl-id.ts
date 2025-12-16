import { prisma } from '../src/lib/prisma';
async function main() {
  const p = await prisma.property.findFirst({ select: { pricelabsListingId: true, name: true } });
  console.log(JSON.stringify(p, null, 2));
}
main();
