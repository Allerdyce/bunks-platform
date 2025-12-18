
import { prisma } from '../src/lib/prisma';

async function main() {
    const record = await prisma.propertyPricing.findFirst({
        where: {
            date: new Date('2099-12-31T00:00:00.000Z')
        },
        select: {
            source: true
        }
    });

    if (record) {
        console.log("PAYLOAD FOUND:");
        console.log(record.source); // This contains "DEBUG: { ... }"
    } else {
        console.log("No debug record found.");
    }
}

main().catch(console.error);
