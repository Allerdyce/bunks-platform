# Local QA harness

Everything here runs against a **local** Postgres database and mock services. Never point it at production.

- `stripe-mock.mjs`: stateful Stripe API mock plus test endpoints that deliver signed webhooks.
- `start.sh`: starts the Stripe mock, a static iCal server (fake Airbnb feeds) and `next dev` on :3000 against `bunks_qa`.
- `../e2e/*.mjs`: scenario scripts. Run `node qa/e2e/run-all.mjs`.

The app reads three QA-only env vars:
- `STRIPE_API_HOST` / `STRIPE_API_PORT` / `STRIPE_API_PROTOCOL` point the Stripe client at the mock.
- `EMAIL_CAPTURE_DIR` writes outgoing email to JSON files instead of Postmark. It is ignored when `NODE_ENV=production`.
