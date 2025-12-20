import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bunks-platform.vercel.app';
const SYNC_URL = `${BASE_URL}/api/pricelabs/sync`;
const TOKEN = process.env.PRICELABS_INTEGRATION_TOKEN;

async function run() {
    if (!TOKEN) {
        console.error("Missing PRICELABS_INTEGRATION_TOKEN");
        process.exit(1);
    }

    console.log(`Simulating PriceLabs Sync to: ${SYNC_URL}`);

    // Mock Payload from PriceLabs
    // Provide a listing_id that exists in your DB, or use a known one.
    // We'll try to use a "test" listing ID or just a random one to see if it logs "Skipping" or "Success".
    const payload = [
        {
            listing_id: "1552191060469626901", // Steamboat ID
            data: [
                {
                    date: new Date().toISOString().split('T')[0],
                    price: 260, // Testing new price
                    min_stay: 4,
                    is_blocked: false
                }
            ]
        }
    ];

    const res = await fetch(SYNC_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-INTEGRATION-TOKEN': TOKEN,
            'X-INTEGRATION-NAME': 'bunks'
        },
        body: JSON.stringify(payload)
    });

    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text}`);
}

run();
