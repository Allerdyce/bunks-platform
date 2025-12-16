
import * as React from 'react';
import { renderEmail, sendEmail } from '@/lib/email';
import { BookDirectCampaignEmail } from '@/emails/BookDirectCampaignEmail';

const EMAIL_TYPE = 'CAMPAIGN_BOOK_DIRECT_V1';

export async function sendBookDirectCampaign(
    toEmail: string,
    guestName: string = 'Guest'
) {
    const html = await renderEmail(
        <BookDirectCampaignEmail
            guestName={guestName}
            ctaUrl={process.env.NEXT_PUBLIC_APP_URL || "https://bunks.com"}
            baseUrl={process.env.NEXT_PUBLIC_APP_URL || "https://bunks.com"}
        />
    );

    try {
        const response = await sendEmail({
            to: toEmail,
            subject: `Save 15% on your next stay with Bunks 🏔️`,
            html,
            // Optional: Tag this for analytics if your provider supports it
            // headers: { 'X-Campaign-Id': 'book-direct-v1' } 
        });

        console.log(`[${EMAIL_TYPE}] Sent to ${toEmail}`);
        return response;
    } catch (error) {
        console.error(`[${EMAIL_TYPE}] Failed to send to ${toEmail}`, error);
        throw error;
    }
}
