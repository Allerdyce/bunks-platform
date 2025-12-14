
process.env.PRICELABS_INTEGRATION_NAME = 'bunks';
process.env.PRICELABS_INTEGRATION_TOKEN = 'LZ7J0W4eQhtm1ohmHX5jQBtLu0f9TVMmcSrl7awKjnykuM27NQNHyt1q+looOG3p';

import { postPricelabs } from "@/lib/pricelabs/client";

interface IntegrationRequest {
    sync_url: string;
    calendar_trigger_url: string;
    hook_url: string;
    regenerate_token?: boolean;
}

interface IntegrationResponse {
    integration_name: string;
    integration_token?: string;
}

// Ensure these are your production/public URLs or ngrok for testing
const BASE_APP_URL = "https://filiberto-eriophyllous-unexcellently.ngrok-free.dev";

const SYNC_URL = `${BASE_APP_URL}/api/pricelabs/sync`;
const CALENDAR_TRIGGER_URL = `${BASE_APP_URL}/api/pricelabs/calendar-trigger`;
const HOOK_URL = `${BASE_APP_URL}/api/pricelabs/hook`;

async function register() {
    console.log(`Registering PriceLabs integration...`);
    console.log(`Sync URL: ${SYNC_URL}`);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const body: any = {
        integration: {
            sync_url: SYNC_URL,
            calendar_trigger_url: CALENDAR_TRIGGER_URL,
            hook_url: HOOK_URL,
            regenerate_token: false,
        }
    };

    try {
        const res = await postPricelabs<IntegrationResponse>("/integration", body);
        console.log("✅ Registration Successful!");
        console.log(`Integration Name: ${res.integration_name}`);
        if (res.integration_token) {
            console.log(`New Token: ${res.integration_token}`);
            console.log("⚠️  Update PRICELABS_INTEGRATION_TOKEN in your .env file!");
        } else {
            console.log("Token unchanged.");
        }
    } catch (error) {
        console.error("❌ Registration Failed:", error);
    }
}

register();
