import crypto from "crypto";

/**
 * Timing-safe check of the `x-integration-token` header against PRICELABS_INTEGRATION_TOKEN.
 * Fails closed when the env var is unset.
 */
export function isValidPriceLabsIntegrationToken(received: string | null | undefined): boolean {
    const configured = process.env.PRICELABS_INTEGRATION_TOKEN;
    if (!configured || !received) return false;
    const a = crypto.createHash("sha256").update(received, "utf8").digest();
    const b = crypto.createHash("sha256").update(configured, "utf8").digest();
    return crypto.timingSafeEqual(a, b);
}
