
import { renderEmail } from '../src/lib/email';
import { BookDirectCampaignEmail } from '../src/emails/BookDirectCampaignEmail';

async function main() {
    console.log('Rendering Book Direct Campaign Email...');

    const html = await renderEmail(
        <BookDirectCampaignEmail
            guestName="Alex"
            ctaUrl="https://bunks.com"
        />
    );

    console.log('--- EMAIL HTML START ---');
    console.log(html);
    console.log('--- EMAIL HTML END ---');
    console.log('Render successful.');
}

main().catch(console.error);
