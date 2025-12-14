import { prisma } from "../src/lib/prisma";

async function main() {
    const slug = "steamboat-downtown-townhome";

    console.log(`Updating location for ${slug}...`);

    const updated = await prisma.property.update({
        where: { slug },
        data: {
            latitude: 40.4850,
            longitude: -106.8317,
        },
    });

    console.log("Updated property:", updated.name, updated.latitude, updated.longitude);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
