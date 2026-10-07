# Local QA harness

Everything here runs against a **local** Postgres database and mock services. Never point it at production.

- `stripe-mock.mjs`: stateful Stripe API mock plus test endpoints that deliver signed webhooks.
- `start.sh`: starts the Stripe mock, a static iCal server (fake Airbnb feeds) and `next dev` on :3000 against `bunks_qa`.
- `../e2e/*.mjs`: scenario scripts. Run `node qa/e2e/run-all.mjs`.

The app reads these QA-only env vars:
- `STRIPE_API_HOST` / `STRIPE_API_PORT` / `STRIPE_API_PROTOCOL` point the Stripe client at the mock.
- `EMAIL_CAPTURE_DIR` writes outgoing email to JSON files instead of Postmark. It is ignored when `NODE_ENV=production`.
- `RATE_LIMIT_DISABLED` and `FEATURE_FLAG_CACHE_MS` turn off rate limits and the feature-flag cache so tests run fast.
- `build-check.sh`: runs `next build` offline (mocks the Google Fonts CSS). Stop the dev server first; the build replaces `.next`.
- `../unit/run.sh`: unit tests for iCal parsing, stay rules, the rate limiter and admin passwords, run under four server timezones.
- `../ui/smoke.mjs`: Playwright pass over public pages, a UI booking, the trip page and admin. Needs `PLAYWRIGHT_MODULE` pointing at an installed `playwright` package.
