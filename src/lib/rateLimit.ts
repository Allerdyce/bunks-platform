import { NextResponse } from 'next/server';

// Best-effort, per-instance fixed-window limiter. On serverless each warm instance keeps its own
// counts, so this slows scripted abuse (guessing booking references, admin passwords, holding
// dates) rather than guaranteeing a global limit. A shared store (e.g. Upstash) would make it exact.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

const disabled = () => process.env.NODE_ENV !== 'production' && process.env.RATE_LIMIT_DISABLED === 'true';

export function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

/** Counts one hit for `key`; returns seconds to wait when over `limit` per `windowMs`, else 0. */
export function hitRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  if (disabled()) return 0;
  if (buckets.size > MAX_KEYS) {
    for (const [k, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(k);
    if (buckets.size > MAX_KEYS) buckets.clear();
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return 0;
  }
  bucket.count += 1;
  return bucket.count > limit ? Math.ceil((bucket.resetAt - now) / 1000) : 0;
}

/** Returns a 429 response when the caller's IP is over the limit for this action, else null. */
export function rateLimitResponse(request: Request, action: string, limit: number, windowMs: number) {
  const retryAfter = hitRateLimit(`${action}:${clientIp(request)}`, limit, windowMs);
  if (!retryAfter) return null;
  return NextResponse.json(
    { error: 'Too many attempts. Please wait a few minutes and try again.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}
