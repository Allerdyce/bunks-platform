
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordGuestLead } from "@/lib/guestLeads";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
    try {
        const { email: rawEmail, name, propertySlug } = await req.json();
        const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

        if (!email || !EMAIL_PATTERN.test(email)) {
            return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
        }

        // Keep the guest in the User table (the Wi-Fi campaign cron reads from it).
        const user = await prisma.user.upsert({
            where: { email },
            update: { updatedAt: new Date() },
            create: {
                email,
                name: name || "WiFi Guest",
                role: "GUEST",
            },
        });

        // Record where and when we captured them for the admin guest list.
        await recordGuestLead({
            email,
            name: typeof name === "string" ? name : null,
            source: "wifi",
            propertySlug: typeof propertySlug === "string" ? propertySlug : null,
        });

        return NextResponse.json({ success: true, userId: user.id });
    } catch (error) {
        console.error("Failed to save wifi lead", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
