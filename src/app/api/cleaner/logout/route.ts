import { clearCleanerSessionCookie } from "@/lib/cleanerAuth";
import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ success: true });
    clearCleanerSessionCookie(response);
    return response;
}
