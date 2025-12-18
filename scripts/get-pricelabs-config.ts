
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const PRICELABS_API_URL = 'https://api.pricelabs.co/v1/integration/api/integration';
const INTEGRATION_NAME = process.env.PRICELABS_INTEGRATION_NAME || 'bunks';
const INTEGRATION_TOKEN = process.env.PRICELABS_INTEGRATION_TOKEN;

async function getConfig() {
    if (!INTEGRATION_TOKEN) throw new Error("Missing Token");

    console.log("Fetching config for:", INTEGRATION_NAME);
    const response = await fetch(PRICELABS_API_URL, {
        method: 'GET',
        headers: {
            'X-INTEGRATION-NAME': INTEGRATION_NAME,
            'X-INTEGRATION-TOKEN': INTEGRATION_TOKEN
        }
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
}

getConfig().catch(console.error);
