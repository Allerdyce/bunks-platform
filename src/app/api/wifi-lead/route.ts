
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { email, name } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Upsert user to capture the lead
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                // Update name if provided and not currently set (or just overwrite? Let's obey existing if strictly set)
                // For simple wifi capture, we might just want to ensure they exist.
                updatedAt: new Date(),
            },
            create: {
                email,
                name: name || "WiFi Guest",
                role: "GUEST",
            },
        });

        return NextResponse.json({ success: true, userId: user.id });
    } catch (error) {
        console.error("Failed to save wifi lead", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
