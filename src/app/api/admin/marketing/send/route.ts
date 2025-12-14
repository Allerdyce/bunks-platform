
import { NextRequest, NextResponse } from 'next/server';
import { sendBookDirectCampaign } from '@/lib/email/sendBookDirectCampaign';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { email, name } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await sendBookDirectCampaign(email, name || 'Guest');

        return NextResponse.json({ success: true, message: `Sent to ${email}` });
    } catch (error: unknown) {
        console.error('Failed to send campaign', error);
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to send campaign' },
            { status: 500 }
        );
    }
}
