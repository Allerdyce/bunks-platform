
const BASE_URL = "https://api.pricelabs.co/v1/integration/api";

export async function postPricelabs<TResponse>(path: string, body: unknown): Promise<TResponse> {
    // Use non-NEXT_PUBLIC vars for secrets
    const name = process.env.PRICELABS_INTEGRATION_NAME;
    const token = process.env.PRICELABS_INTEGRATION_TOKEN;

    if (!name || !token) {
        throw new Error("PriceLabs integration name/token not configured");
    }

    // Ensure leading slash for path
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${BASE_URL}${normalizedPath}`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Integration-Name": name,
            "X-Integration-Token": token,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PriceLabs API error (${res.status}): ${text}`);
    }

    return (await res.json()) as TResponse;
}
