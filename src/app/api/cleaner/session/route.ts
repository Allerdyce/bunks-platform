import { readCleanerSessionFromRequest } from "@/lib/cleanerAuth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const session = readCleanerSessionFromRequest(request);

    if (!session) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, email: session.email });
}
