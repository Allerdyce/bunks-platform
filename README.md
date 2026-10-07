# Bunks

Direct-booking site for the Bunks homes (Steamboat and Summerland) at [www.bunks.com](https://www.bunks.com), with an admin console at `/admin`.

Next.js (app router) · Prisma on Neon Postgres · Stripe · Postmark with React Email · deployed on Vercel from `main`.

## Working on it

```bash
pnpm install
pnpm dev
```

The QA stack runs the app against a local Postgres and mock Stripe: see [`qa/harness/README.md`](qa/harness/README.md). Unit tests: `bash qa/unit/run.sh`. Offline production build: `bash qa/harness/build-check.sh`.

Changes reach production through pull requests into `main`; Vercel deploys every merge.

## Admin

- Sign in at `/admin` with an allowed admin email (the comma-separated `ADMIN_EMAILS`) and that person's own password.
- `node scripts/admin-password.mjs <email> [<email> …]` makes a strong password for each person plus the `ADMIN_PASSWORD_HASHES` value to paste into Vercel; only the hashes are stored. Anyone on `ADMIN_EMAILS` without their own entry falls back to the shared `ADMIN_PASSWORD`, if set. To remove someone, take them off `ADMIN_EMAILS`.
- In production, `ADMIN_SESSION_SECRET` (32+ characters) plus either `ADMIN_PASSWORD_HASHES` or `ADMIN_PASSWORD` are required; admin login is disabled until they are set.

The console covers bookings and private payment links, pricing, the Airbnb calendar sync and the Bunks calendar export (Setup), guest emails, and marketing.

## Pricing

- **Nightly rates** follow Airbnb: a GitHub Action (`.github/workflows/airbnb-price-check.yml`, twice a day) fetches Airbnb's quotes and Bunks saves each night's rate (special rates noted `auto:airbnb`). This needs `AIRBNB_GUEST_FEE_PCT` set and the **Airbnb pricing** switch on in Admin → Pricing. Otherwise, or for a night with no Airbnb rate, the weekday/weekend rates in Admin → Pricing apply. Admin one-off prices override both.
- **A direct booking** gets 10% off the nightly subtotal, plus the cleaning fee, a 5% Bunks service fee on the discounted nightly subtotal, and the home's taxes (`src/lib/pricing/calculator.ts`).
- **Private payment links** (Admin → Bookings → New private booking) use whatever nightly, cleaning, service fee and tax the admin enters, and hold the dates until the link expires.

## Emails

Guests get three emails per stay: the booking confirmation (with the receipt), arrival details the day before check-in, and the checkout reminder. Hosts get a new-booking alert. Cancellations, refunds and payment links send their own emails. The daily job is `src/app/api/cron/automations/route.ts`.

Admin → Emails previews every template with sample data and can send a sample. To add a template:

1. Write the component in `src/emails/`.
2. Add sample props in `src/lib/email/sampleData.ts` (made-up details only: samples can be sent to any address).
3. Register it in `src/lib/email/templateRenderers.tsx`, `src/lib/email/sampleSenderConfig.ts`, `src/lib/email/subjects.ts` and `src/lib/email/catalog.ts`.

## Database changes

The migrations in `prisma/migrations/` don't fully match production (it was changed with `prisma db push` early on), so don't run `prisma migrate` against Neon. For a schema change, write re-runnable SQL (see `prisma/migrations/20261006120000_private_payment_links/migration.sql`), run it in the Neon SQL Editor before the code that needs it deploys, then merge. `node prisma/seed.mjs` is for local and QA databases only.

## Environment variables

Set in Vercel (Production). Secrets are marked Sensitive.

| Variable | What it's for |
|---|---|
| `DATABASE_URL` | Neon Postgres |
| `NEXT_PUBLIC_APP_URL` | Site address used in emails and links |
| `ADMIN_EMAILS`, `ADMIN_PASSWORD_HASHES`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Admin sign-in (see above) |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Payments; the webhook is `POST /api/stripe` |
| `POSTMARK_API_KEY`, `POSTMARK_FROM_ADDRESS` | Email (`POSTMARK_MESSAGE_STREAM`, `POSTMARK_BROADCAST_STREAM` optional) |
| `NEXT_PUBLIC_SUPPORT_EMAIL`, `OPS_ALERT_EMAIL` | Guest-facing support address; where ops alerts go |
| `EMAIL_SENDING_PAUSED` | Marketing email only sends when this is `false` |
| `EMAIL_PAUSE_ALL` | `true` stops every email, transactional included |
| `CRON_SECRET` | Vercel Cron calls to `/api/cron/*` |
| `ICAL_FEED_SECRET`, `GUIDE_LINK_SECRET` | Signing the calendar export and guide links (fall back to `ADMIN_SESSION_SECRET`) |
| `PRICE_CHECK_SECRET` | The Airbnb price-check runner (also a GitHub Actions secret) |
| `AIRBNB_GUEST_FEE_PCT` | Turns on Airbnb-driven nightly rates (`0` when the host pays Airbnb's fee) |
| `PRICE_CHECK_ALERT_EMAIL`, `PRICE_CHECK_DIGEST`, `PRICE_CHECK_MIN_SAVINGS_PCT`, `PRICE_CHECK_COMPARE_WITH_TAX` | Price-check email and comparison settings |

QA-only: `RATE_LIMIT_DISABLED`, `FEATURE_FLAG_CACHE_MS`, `EMAIL_CAPTURE_DIR`, `STRIPE_API_HOST`/`PORT`/`PROTOCOL` (stripe-mock), `SEED_ALLOW_REMOTE`.
