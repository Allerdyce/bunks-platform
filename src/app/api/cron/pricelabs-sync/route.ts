import { NextResponse } from 'next/server';
import { syncPriceLabsData } from '@/lib/pricelabs/sync';
import { isAuthorizedCronRequest } from '@/lib/cronAuth';

export const dynamic = 'force-dynamic'; // Ensure not cached

export async function GET(request: Request) {
    if (!isAuthorizedCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const results = await syncPriceLabsData();

        // Per-property errors are logged inside syncPriceLabsData; don't echo raw error strings.
        const summary = results.map(({ propertyId, status, count }: { propertyId: number; status: string; count?: number }) => ({
            propertyId,
            status,
            ...(count !== undefined ? { count } : {}),
        }));

        return NextResponse.json({ success: true, results: summary });
    } catch (error) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
    }
}
