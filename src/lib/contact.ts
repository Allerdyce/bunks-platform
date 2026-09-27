// Single support contact for the site, both properties and guest emails.
// Per-property "Guest support email" in Admin → Setup overrides it where set.
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "alissa@bunks.com";

// Where internal alerts (payment problems, sync errors) go.
export const OPS_ALERT_EMAIL = process.env.OPS_ALERT_EMAIL || SUPPORT_EMAIL;
