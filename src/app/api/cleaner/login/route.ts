import { createCleanerSessionToken, isValidCleanerCredentials, setCleanerSessionCookie } from "@/lib/cleanerAuth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password required" }, { status: 400 });
        }

        if (!isValidCleanerCredentials(email, password)) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const token = createCleanerSessionToken(email);
        const response = NextResponse.json({ success: true });
        setCleanerSessionCookie(response, token);

        return response;
    } catch (error) {
        console.error("Cleaner login error", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
