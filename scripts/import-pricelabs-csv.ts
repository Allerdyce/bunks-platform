import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
    const filePath = path.join(process.cwd(), 'pricelabs.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Split lines and remove header (first 2 lines based on file view)
    const lines = fileContent.split('\n').filter(l => l.trim().length > 0);
    // Line 1 is comments, Line 2 is headers. Start from line 3 (index 2)
    const dataLines = lines.slice(2);

    // Update property ID first
    const targetProperty = await prisma.property.findFirst({
        where: { name: { contains: 'Downtown' } }
    });

    if (!targetProperty) {
        console.error('Property not found');
        return;
    }

    const csvListingId = "1552191060469626901";
    await prisma.property.update({
        where: { id: targetProperty.id },
        data: { pricelabsListingId: csvListingId }
    });
    console.log(`Updated property ${targetProperty.id} with PriceLabs ID: ${csvListingId}`);

    let count = 0;
    for (const line of dataLines) {
        // CSV format: PMS Name,Listing ID,Listing Name,Tags,Date,Available,Recommended Price...
        // We need to parse strictly. Simple split by comma might fail if names have commas, but Listing Name has quotes.
        // Let's use a simple regex or assumption since we know the structure.
        // Date is at index 4?
        // Let's split by comma, but respect quotes?
        // Actually, Date is standard format YYYY-MM-DD.

        // Quick regex to handle basic CSV with quotes
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        // Actually, simple split might work if fields don't contain commas except Name.
        // Name is "Luxury Downtown Townhome &amp; Ski Locker, AC, Garage". It has commas.
        // So splitting by comma is risky.

        // Better: Find the date pattern YYYY-MM-DD
        const dateMatch = line.match(/\d{4}-\d{2}-\d{2}/);
        if (!dateMatch) continue;
        const dateStr = dateMatch[0];
        const dateIndex = line.indexOf(dateStr);

        // Everything before date is metadata.
        // Immediate fields after Date: Available, Recommended Price...
        const rest = line.substring(dateIndex + dateStr.length + 1); // +1 for comma
        const parts = rest.split(',');

        // parts[0] = Available (False/True)
        // parts[1] = Recommended Price
        // parts[2] = Price with Default
        // parts[3] = Your Price
        // parts[4] = Min Stay

        const available = parts[0];
        const price = parseInt(parts[1]);
        const minStay = parseInt(parts[4]);

        if (isNaN(price)) continue;

        await prisma.propertyPricing.upsert({
            where: {
                propertyId_date: {
                    propertyId: targetProperty.id,
                    date: new Date(dateStr)
                }
            },
            create: {
                propertyId: targetProperty.id,
                date: new Date(dateStr),
                priceCents: price * 100, // CSV is in dollars
                minNights: isNaN(minStay) ? undefined : minStay,
                isBlocked: available.toLowerCase() === 'false', // If Available is False, it is blocked? Wait.
                // Usually "Available: False" means blocked. "Available: True" means bookable.
                // Let's verify standard CSV.
                // Logic: isBlocked = available === 'False'
                source: 'pricelabs-csv'
            },
            update: {
                priceCents: price * 100,
                minNights: isNaN(minStay) ? undefined : minStay,
                updatedAt: new Date()
            }
        });
        count++;
    }
    console.log(`Imported ${count} pricing records.`);
}

main();
