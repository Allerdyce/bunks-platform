# Airbnb guest quote runner

Standalone Node 22 runner with no installed dependencies. It gets stay scenarios from Bunks, fetches public Airbnb guest-facing quotes serially, and posts one results batch back to Bunks. The runner itself doesn't calculate rates or send alerts: Bunks turns the quotes into its nightly rates (when Airbnb pricing is on), compares prices and emails the digest.

## Setup and activation

Set these GitHub Actions **repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Purpose |
| --- | --- |
| `BUNKS_BASE_URL` | HTTPS origin of Bunks, such as `https://www.bunks.com`. No path, query, credentials, or fragment. Use its canonical host; redirects are rejected. |
| `PRICE_CHECK_SECRET` | Bearer token shared with the Bunks endpoints. |
| `AIRBNB_API_KEY` | Optional public web app key override; otherwise extracted once per run from the first scenario's listing page. |
| `AIRBNB_BOOKIT_HASH` | Optional 64-character lowercase hexadecimal persisted-query hash override. |

Never commit secret values. The runner sends the bearer token only to the two Bunks endpoints and does not log request headers or raw response bodies.

The workflow `.github/workflows/airbnb-price-check.yml` runs twice a day on `main`: `0 15 * * *` and `0 3 * * *` UTC, which is 08:00 / 20:00 Los Angeles during PDT and **07:00 / 19:00 during PST**. GitHub may delay scheduled jobs. No workflow is triggered on pushes or pull requests, and no live Airbnb requests are made by tests.

To run it by hand: Actions → **Airbnb price check** → **Run workflow**. Leave `dry_run` checked to check scenario retrieval and the planned requests without calling Airbnb. With the GitHub CLI:

```sh
gh workflow run airbnb-price-check.yml --ref main -f dry_run=true
gh workflow run airbnb-price-check.yml --ref main -f dry_run=false
```

## Local use

Supply the secrets through your shell or secret manager, then run from the repository root with Node 22:

```sh
node scripts/airbnb-price-runner/index.mjs --dry-run
node scripts/airbnb-price-runner/index.mjs
node --test scripts/airbnb-price-runner/*.test.mjs
```

Dry-run **does call Bunks' scenarios endpoint**, but never calls Airbnb or posts results. It prints the listing-page bootstrap URL (unless overridden), planned quote URLs and request cap, without credentials. It may print more scenarios than can fit the cap; real runs report unfetched scenarios as errors. Bunks should avoid treating dry-run scenario retrieval as a completed collection.

## Bunks contract

`GET /api/price-check/scenarios` with `Authorization: Bearer <secret>` must return HTTP 200 and:

```json
{
  "runId": "unique-run-id",
  "currency": "USD",
  "locale": "en",
  "scenarios": [
    {
      "scenarioId": "unique-scenario-id",
      "listingId": "numeric ID as a string",
      "checkIn": "2026-11-10",
      "checkOut": "2026-11-13",
      "adults": 2,
      "pets": 0
    }
  ]
}
```

Bunks selects every listing, date, and guest count; none are hard-coded into the runner. Currently only USD/en and adult/pet counts are supported. `pets` can be omitted, meaning zero. Invalid dates, numeric listing IDs (which lose precision), invalid guest counts, duplicate scenario IDs, or an invalid root contract fail the Action before any Airbnb call.

`POST /api/price-check/results` uses the same bearer header and JSON content type. The payload includes `runId`, an ISO UTC `capturedAt` taken after collection, `runner: { bookItHash, version }`, and `quotes`. Version is `GITHUB_SHA`, or `1.0.0` outside Actions. An empty scenario list produces an empty results batch. A successful results endpoint must return 2xx; its body is not interpreted.

Once valid scenarios are acquired, the runner posts one result per scenario even when every quote fails, bootstrap/key discovery fails, or the hash/key override is invalid. Failure to get scenarios or deliver results exits non-zero. Successfully delivered quote failures leave the Action green: Bunks must use quote statuses to detect collection failures. POST delivery is not retried automatically because server idempotency is unspecified; network loss can leave delivery uncertain.

| Status | Meaning |
| --- | --- |
| `ok` | Explicitly available stay with a positive, strictly parsed USD price. Only these entries include integer `totalCents`. |
| `unavailable` | Airbnb explicitly returned `availability.isAvailable=false`. `unavailableReason` holds its message when supplied. No price is reported. |
| `error` | Network/timeout failure after one retry, non-blocking HTTP error, GraphQL errors, missing/malformed data, unparseable amount, bootstrap/configuration failure, or exhausted request/time budget. |
| `blocked` | HTTP 401/403/429, detected challenge HTML, or backoff exceeding the run's wait limit. Further Airbnb calls stop, and remaining scenarios also get `blocked`. |

Each quote also includes `scenarioId`, `currency`, `feesIncluded`, `priceLabel`, `nightsLine`, `cancellation`, `unavailableReason`, `error`, and `httpStatus`. Unused text fields are null. `httpStatus` is null when the scenario was skipped or no HTTP response was received; bootstrap failure reasons are reported without inventing a quote HTTP status.

`nightlyBreakdown` is `[{ label, cents }]` when Airbnb itemises the nights under the **N nights x $X** line (dated lines only), otherwise null. Bunks uses it to price each night exactly only when the lines add up to the quote; otherwise every night gets the stay's average.

## Price semantics and limits

- The persisted operation is `StaysPdpBookItQuery`; the initial hash is the one verified in the September 27, 2026 research. It is an internal web query, not a stable partner API. Hash/schema failures report errors; update the optional hash only after verifying a new request.
- Amount preference: the **Price after discount** line's `priceString`, then the **N nights x $X** line's `priceString` (the full stay amount), then `structuredDisplayPrice.primaryLine.price`. A malformed higher-priority amount is an error, not permission to fall back to a potentially different total. Only positive `$1,234` / `$1,234.56` style amounts, with optional comma grouping, are accepted. No floating-point rounding, currency conversion or multiplication of nightly equivalents.
- `feesIncluded` is true only when the response announces **Prices include all fees**. Missing announcements produce false, not an assumption. `ok` does not imply that tax inclusion is known. These are guest-facing quotes, not base nightly rates or verified final checkout totals.
- Requests have a 15-second timeout covering headers and body, use manual redirects, and run serially with a random 2–4 seconds between attempts. Network failures and 5xx receive at most one retry. `Retry-After` seconds and HTTP dates are respected. Values over 60 seconds stop Airbnb collection and report `blocked` rather than retrying early.
- The hard cap is **40 Airbnb requests per run including bootstrap and retries**. Without overrides or retries, that leaves 39 quote calls. A ten-minute Airbnb collection budget leaves time to post results within the workflow's 15-minute timeout. Budget-exhausted scenarios still receive errors.
- Workflow concurrency prevents overlapping runs; the runner never uses proxies, solves challenges, or attempts to bypass an access block. No host account credentials are used.
- Airbnb's [terms](https://www.airbnb.com/help/article/2857) restrict automated collection. Confirm the intended operating arrangement before enabling ongoing runs.

## Verification

`fixtures/verified-quotes.json` contains the two public research responses (no auth credentials): $1,450 and $3,003 for November 10–13, 2026, two adults. These are offline fixtures, not current prices.

Tests cover exact cents and fee/label/cancellation extraction, unavailable and GraphQL responses, strict price failures, bootstrap decoding, request variables, overrides, dry-run, blocked-run reporting, retries/backoff, body timeouts, request/time budgets, empty scenarios, invalid contracts, and failed delivery. All network requests are injected fakes; no Airbnb or Bunks network calls occur during tests.
