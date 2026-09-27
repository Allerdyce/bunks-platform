
import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { recordGuestLead } from "@/lib/guestLeads";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 80;

// Names are shown in admin and greeted in the book-direct email, so keep them short and plain.
const cleanName = (value: unknown) =>
    typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f<>]/g, "").trim() : "";

export async function POST(req: NextRequest) {
    const limited = rateLimitResponse(req, "wifi-lead", 10, 10 * 60_000);
    if (limited) return limited;

    try {
        const payload = await req.json().catch(() => null);
        if (!payload || typeof payload !== "object") {
            return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
        }
        const { email: rawEmail, name: rawName, propertySlug: rawSlug } = payload as Record<string, unknown>;
        const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

        if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
            return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
        }
        const name = cleanName(rawName);
        if (name.length > MAX_NAME_LENGTH) {
            return NextResponse.json({ error: "Please use a shorter name" }, { status: 400 });
        }
        const propertySlug = typeof rawSlug === "string" && /^[a-z0-9-]{1,100}$/.test(rawSlug) ? rawSlug : null;

        // Keep the guest in the User table (the Wi-Fi campaign cron reads from it).
        await prisma.user.upsert({
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
            name: name || null,
            source: "wifi",
            propertySlug,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save wifi lead", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
