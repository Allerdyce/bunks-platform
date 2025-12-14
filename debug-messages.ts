
import { prisma } from "@/lib/prisma";

async function main() {
    const bookingId = 24;
    const conversation = await prisma.conversation.findUnique({
        where: { bookingId },
        include: {
            messages: {
                include: { sender: true },
                orderBy: { sentAt: "asc" },
            },
            booking: true,
        },
    });

    if (!conversation) {
        console.log("No conversation found for booking 24");
        return;
    }

    const guestEmail = conversation.booking.guestEmail;
    console.log("Guest Email:", guestEmail);

    // Find or create guest user
    let guestUser = await prisma.user.findUnique({ where: { email: guestEmail } });
    if (!guestUser) {
        console.log("Creating guest user...");
        guestUser = await prisma.user.create({
            data: { email: guestEmail, role: "GUEST", name: "Ali Guest" },
        });
    }

    if (conversation.messages.length > 0) {
        const lastMsg = conversation.messages[conversation.messages.length - 1];
        // console.log(`Updating message ${lastMsg.id} to be from guest ${guestUser.email}...`);
        await prisma.message.update({
            where: { id: lastMsg.id },
            data: { senderId: guestUser.id },
        });
        console.log("Updated message ownership.");
    } else {
        console.log("No messages to update.");
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                body: "Hey, looking forward to my stay!",
                senderId: guestUser.id,
                sentAt: new Date(),
            },
        });
        console.log("Created new guest message.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
