
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // or .env

const PRICELABS_API_URL = 'https://api.pricelabs.co/v1/integration/api/integration';
const BUNKS_BASE_URL = 'https://www.bunks.com';

const INTEGRATION_NAME = process.env.PRICELABS_INTEGRATION_NAME || 'bunks';
const INTEGRATION_TOKEN = process.env.PRICELABS_INTEGRATION_TOKEN;

async function register() {
    if (!INTEGRATION_TOKEN) {
        throw new Error('Missing PRICELABS_INTEGRATION_TOKEN');
    }

    console.log(`Registering PMS '${INTEGRATION_NAME}' with PriceLabs...`);

    const payload = {
        integration: {
            sync_url: `${BUNKS_BASE_URL}/api/pricelabs/sync`,
            calendar_trigger_url: `${BUNKS_BASE_URL}/api/pricelabs/sync`,
            hook_url: `${BUNKS_BASE_URL}/api/pricelabs/sync`,
            regenerate_token: false,
            features: {
                min_stay: true,
                check_in: true,
                check_out: true,
                monthly_weekly_discounts: false,
                extra_person_fee: false,
                los_pricing: false,
                delta_only: false
            }
        }
    };

    // Fix variable name typo above in payload Construction manually before writing?
    // Correcting payload in the string below.

    const correctPayload = {
        integration: {
            sync_url: `${BUNKS_BASE_URL}/api/pricelabs/sync`,
            calendar_trigger_url: `${BUNKS_BASE_URL}/api/pricelabs/calendar-trigger`,
            // Hook verification failing on prod (401). Skipping optional hook for now.
            // hook_url: `${BUNKS_BASE_URL}/api/pricelabs/hook`,
            regenerate_token: false,
            features: {
                min_stay: true,
                check_in: true,
                check_out: true,
                monthly_weekly_discounts: false,
                extra_person_fee: false,
                los_pricing: false,
                delta_only: false
            }
        }
    };

    console.log('Sending payload:', JSON.stringify(correctPayload, null, 2));

    const response = await fetch(PRICELABS_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-INTEGRATION-NAME': INTEGRATION_NAME,
            'X-INTEGRATION-TOKEN': INTEGRATION_TOKEN
        },
        body: JSON.stringify(correctPayload)
    });

    const responseText = await response.text();
    console.log(`Status: ${response.status}`);
    console.log('Response:', responseText);

    if (!response.ok) {
        console.error('Registration Failed');
        process.exit(1);
    }
}

register().catch(console.error);
