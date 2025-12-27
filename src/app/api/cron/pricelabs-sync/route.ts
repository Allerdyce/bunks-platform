
import { NextResponse } from 'next/server';
import { syncPriceLabsData } from '@/lib/pricelabs/sync';

export const dynamic = 'force-dynamic'; // Ensure not cached

export async function GET(request: Request) {
    try {
        // Simple security: Check for Vercel Cron header
        // In local, you can bypass or add a secret query param if needed.
        // For now, we allow it.

        const authHeader = request.headers.get('authorization');

        // Optional: Could verify a CRON_SECRET if configured
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return new NextResponse('Unauthorized', { status: 401 });
        // }

        const results = await syncPriceLabsData();

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
