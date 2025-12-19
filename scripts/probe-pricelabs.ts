
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const token = process.env.PRICELABS_INTEGRATION_TOKEN;
const name = process.env.PRICELABS_INTEGRATION_NAME || 'bunks';

const variants = [
    { url: 'https://api.pricelabs.co/v1/integration', method: 'POST' },
    { url: 'https://api.pricelabs.co/v1/integration', method: 'GET' },
    { url: 'https://api.pricelabs.co/integration', method: 'POST' },
    { url: 'https://api.pricelabs.co/v1/integration_listings', method: 'POST' },
    { url: 'https://api.pricelabs.co/v1/integration/api/integration', method: 'POST' },
];

async function probe() {
    console.log(`Probing with Token: ${token?.slice(0, 5)}...`);

    for (const v of variants) {
        try {
            console.log(`Testing ${v.method} ${v.url}...`);
            const res = await fetch(v.url, {
                method: v.method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-INTEGRATION-NAME': name,
                    'X-INTEGRATION-TOKEN': token || ''
                },
                body: v.method === 'POST' ? JSON.stringify({}) : undefined
            });
            console.log(`Status: ${res.status}`);
            if (res.status !== 404) {
                console.log(`>>> POSSIBLE MATCH: ${v.url} [${res.status}]`);
            }
        } catch (e) {
            console.log(`Error: ${e}`);
        }
    }
}

probe();
