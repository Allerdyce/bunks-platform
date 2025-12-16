
import { PrismaClient } from '@prisma/client';
import { calculatePricing } from '../src/lib/pricing/calculator';

const prisma = new PrismaClient();

async function main() {
    const slug = 'steamboat-downtown-townhome'; // Assuming this is the property
    // User mentioned Dec 27-28
    const checkIn = new Date('2025-12-27T00:00:00Z');
    const checkOut = new Date('2025-12-28T00:00:00Z');

    console.log(`Checking pricing for ${slug} from ${checkIn.toISOString()} to ${checkOut.toISOString()}`);

    const property = await prisma.property.findUnique({
        where: { slug },
        include: { taxes: true }
    });

    if (!property) {
        console.error('Property not found');
        return;
    }
    console.log(`Property ID: ${property.id}, Base Price: ${property.baseNightlyRate}`);

    // Check PropertyPricing directly
    // @ts-ignore
    const pricing = await prisma.propertyPricing.findMany({
        where: {
            propertyId: property.id,
            date: {
                gte: checkIn,
                lt: checkOut
            }
        }
    });

    console.log('Direct DB Query found PropertyPricing records:', pricing);
    console.log('First record date type:', typeof pricing[0]?.date, pricing[0]?.date);
    if (pricing.length > 0) {
        console.log('Record Date ISO:', pricing[0].date.toISOString());
    }

    // Run Calculator
    const quote = await calculatePricing(slug, checkIn, checkOut, 2);
    console.log('Calculator Quote:', JSON.stringify(quote, null, 2));

    // Check map keys logic from calculator
    if (pricing.length > 0) {
        const date = pricing[0].date;
        const key = date.toISOString().split('T')[0];
        console.log(`Expected Map Key: ${key}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
