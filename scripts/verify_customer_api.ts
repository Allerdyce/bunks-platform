
const API_KEY = 'SUJWpmLtQaRCSg9GjZwq5G8Z7D0v8rQ6rRfcHbLt';

async function probe() {
    console.log("Probing PriceLabs Customer API (Round 2)...");

    const endpoints = [
        { method: 'GET', url: `https://api.pricelabs.co/v1/listings?api_key=${API_KEY}` },
        { method: 'POST', url: `https://api.pricelabs.co/v1/listing_prices?api_key=${API_KEY}`, body: { listing_ids: ["bunks_11"] } }
    ];

    for (const ep of endpoints) {
        try {
            console.log(`\nTesting ${ep.method} ${ep.url.split('?')[0]}...`); // hide key in log
            const res = await fetch(ep.url, {
                method: ep.method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: ep.body ? JSON.stringify(ep.body) : undefined
            });

            console.log(`Status: ${res.status}`);
            const text = await res.text();
            console.log(`Response: ${text.slice(0, 500)}`);

        } catch (e) {
            console.error("Error:", e);
        }
    }
}

probe();
