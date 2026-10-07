
import { renderEmail, sendEmail } from '@/lib/email';
import { BookDirectCampaignEmail } from '@/emails/BookDirectCampaignEmail';
import { MessageStream } from '@/lib/email/postmark';

const EMAIL_TYPE = 'CAMPAIGN_BOOK_DIRECT_V1';

export async function sendBookDirectCampaign(
    toEmail: string,
    guestName: string = 'Guest'
) {
    const html = await renderEmail(
        <BookDirectCampaignEmail
            guestName={guestName}
            ctaUrl={process.env.NEXT_PUBLIC_APP_URL || "https://bunks.com"}
        />
    );

    try {
        const response = await sendEmail({
            to: toEmail,
            subject: `Save 10% on your next stay with Bunks`,
            html,
            category: 'marketing',
            messageStream: MessageStream.broadcast,
        });

        console.log(`[${EMAIL_TYPE}] Sent to ${toEmail}`);
        return response;
    } catch (error) {
        console.error(`[${EMAIL_TYPE}] Failed to send to ${toEmail}`, error);
        throw error;
    }
}
