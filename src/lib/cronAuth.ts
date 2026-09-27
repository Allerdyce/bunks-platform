import crypto from "crypto";

// Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` when CRON_SECRET is set on the project.
// Fails closed in production when the secret is missing.
export function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
