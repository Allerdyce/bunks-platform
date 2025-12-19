
const BASE_URL = "https://api.pricelabs.co/v1/integration/api";

export async function postPricelabs<TResponse>(endpoint: string, body: unknown): Promise<TResponse> {
    // Use non-NEXT_PUBLIC vars for secrets
    const name = process.env.PRICELABS_INTEGRATION_NAME;
    const token = process.env.PRICELABS_INTEGRATION_TOKEN;

    if (!name || !token) {
        console.error("PriceLabs integration name/token not configured");
        // We might not want to throw in production to avoid crashing unrelated flows, 
        // but for now throwing is safer to detect issues.
        throw new Error("PriceLabs integration name/token not configured");
    }

    // Ensure leading slash for path
    const normalizedPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${BASE_URL}${normalizedPath}`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-INTEGRATION-NAME": name,
                "X-INTEGRATION-TOKEN": token,
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`PriceLabs API error (${res.status}): ${text}`);
        }

        // Some endpoints might return empty body
        const text = await res.text();
        return text ? JSON.parse(text) : {} as TResponse;
    } catch (error) {
        console.error(`PriceLabs POST ${endpoint} failed:`, error);
        throw error;
    }
}

