import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const logPath = '/tmp/pl-debug.log';
        if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, 'utf-8');
            return new NextResponse(content, { status: 200 });
        }
        return new NextResponse("Log file empty or not found", { status: 200 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
