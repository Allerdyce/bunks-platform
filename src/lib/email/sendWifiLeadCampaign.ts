
import { render } from '@react-email/components';
import { sendEmail } from './sendEmail';
import { BookDirectCampaignEmail } from '@/emails/BookDirectCampaignEmail';

interface WifiLeadCampaignOptions {
    email: string;
    name?: string;
}

export async function sendWifiLeadCampaign({ email, name }: WifiLeadCampaignOptions) {
    const emailHtml = await render(BookDirectCampaignEmail({ guestName: name || 'Guest' }));

    return sendEmail({
        to: email,
        subject: "Until Next Time 🏔️ (A special invite)",
        html: emailHtml,
    });
}
