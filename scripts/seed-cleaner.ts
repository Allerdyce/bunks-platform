
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'cleaner@bunks.com';

    console.log(`Seeding cleaner user: ${email}...`);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: UserRole.CLEANER,
        },
        create: {
            email,
            name: 'Bunks Cleaner',
            role: UserRole.CLEANER,
        },
    });

    console.log(`✅ Cleaner user ready: ${user.email} (ID: ${user.id})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
