# QA tickets: overnight audit, 27 Sep 2026

Branch `claude/bold-curie-7laxza` (on top of the design branch `codex/kindred-ui-refresh`). Every ticket came from a code audit or a failing test. **Status** is one of Fixed, Default taken (fixed a certain way; you may want it different), Parked (needs you), or Won't fix.

**Evidence** names the test that proves it. Test IDs refer to:
- `qa/e2e/run-all.mjs`: end-to-end API scenarios against a local database with fake Stripe and fake Airbnb.
- `qa/ui/smoke.mjs`: real-browser tests.
- `qa/unit/*.test.ts`: unit tests, run under 4 server timezones.

The baseline run before any fixes is `qa/results/e2e-baseline.json`: 77/101 passing. Final runs: `qa/results/e2e-final.json` (135/135), `qa/results/ui-final.json` (50/50), `qa/results/unit-final.txt` (17/17 × 4 timezones) and `qa/results/build-final.log` (production build OK).

## Calendar and availability

| ID | Sev | Problem | Status | Evidence |
|---|---|---|---|---|
| T-AV-01 | P0 | A cut-off or partly parsed Airbnb feed was read as "no reservations" and **deleted every Airbnb block**. A valid but empty feed did the same. | Fixed. Incomplete feeds are rejected. An empty feed while upcoming Airbnb nights exist is refused until an admin confirms it in Setup. | F3, F4, F5, F6; unit `ical.test.ts` |
| T-AV-02 | P1 | If the Airbnb import broke (link reset, Airbnb outage), checkout kept taking payments against stale data, and nobody was told. | **Default taken.** Checkout pauses with a friendly message while the Airbnb calendar can't be read, and the daily import emails an alert. | F7, F8, F9 |
| T-AV-03 | P1 | Late payments versus other guests' holds. | **Revised after independent review** (see HANDOFF). A guest whose payment has gone through keeps the stay. An unpaid guest who pays afterwards is refunded automatically and emailed why. | X1–X3, L1–L7 |
| T-AV-04 | P1 | The payment webhook confirmed bookings without re-reading Airbnb. | Fixed. It re-syncs if the last sync is over 60s old. What remains is the delay on Airbnb's own side. | code, A-series |
| T-AV-05 | P1 | All-day Airbnb dates shift a day early when the server timezone is east of UTC (a risk if the app is ever run outside Vercel). | Fixed. | unit, 4 timezones |
| T-AV-06 | P1 | Admin block/override picker also blocked the **checkout night**, and shifted dates for admins outside the US. | Fixed (UI now sends the last night, in local dates). | OP3–OP5 (API); picker change reviewed, not browser-tested |
| T-AV-07 | P2 | The public quote said "available" for stays checkout would reject (minimum stay, past dates). | Fixed. The same rules now apply to both. | Q7 |
| T-AV-08 | P1 | Calendar counted a Halloween→Nov 2 stay as 3 nights (DST), letting 2-night stays through to a checkout error. | Fixed. | unit (stay rules) |
| T-AV-09 | P1 | If availability failed to load, the calendar silently showed every date as free. | Fixed. It now shows a warning. | not browser-tested |
| T-AV-12 | P1 | Airbnb reads the Bunks calendar only every few hours, so an Airbnb guest can still book nights just paid for directly. This can't be fully prevented. | Mitigated. Each import compares Airbnb "Reserved" nights with paid direct stays and emails an urgent alert once per booking. | DB1–DB3 |
| T-AV-13 | P1 | (review) An empty Airbnb feed paused checkout for up to a day, and only the daily job sent an alert. | Fixed. An empty feed keeps the old blocks, which can only over-block, so checkout continues. Any failed import emails an alert, at most every 4 hours. | F4b, F4c, F8 |
| T-AV-14 | P2 | (review) The iCal parser merges events that share an ID, which could drop a reservation or trip the "malformed" guard. | Fixed. Each event is parsed on its own. | unit |
| T-AV-10 | P2 | `BlockedDate` has no unique constraint, so concurrent imports can duplicate rows (harmless for availability). | Parked. Needs a schema migration. | — |
| T-AV-11 | P2 | The Bunks→Airbnb feed token fell back to `ADMIN_SESSION_SECRET`. | Q4 answered: set a separate `ICAL_FEED_SECRET`. | HUMAN-TASKS 1b |

## Booking and payment

| ID | Sev | Problem | Status | Evidence |
|---|---|---|---|---|
| T-BK-03 | P1 | A guest's failed second checkout attempt cancelled their first, still-valid hold. | Fixed. | T1–T3 |
| T-BK-04 | P1 | No maximum stay or booking horizon. A script could hold two years of dates. | **Default taken.** Maximum 60 nights, up to 2 years ahead; longer stays are handled by email. | V5 |
| T-BK-05 | P1 | "Dates just taken" showed raw JSON to the guest. | Fixed. | D2, UB7 |
| T-BK-06 | P2 | Impossible dates (Feb 30) rolled over to March. | Fixed. | V4, unit |
| T-BK-07 | P2 | 20 guests for a 6-guest home was silently accepted as 6. | Fixed. Rejected with a message. | V6, SL3 |
| T-BK-08 | P2 | A bad email, a non-string field or broken JSON returned 500 errors. | Fixed with validation. | V7, V8, V11 |
| T-BK-09 | P1 | After any checkout error, the summary showed "$315 × 4 = $1,400" and dropped taxes. | Fixed. | UB7 screenshot |
| T-BK-10 | P1 | A typo in the admin refund amount cancelled the booking with a **$0 refund**. | Fixed. Now rejected. | PR4 |
| T-BK-11 | P2 | An admin cancel racing a payment could keep the money and cancel the stay. | Fixed with a conditional update. | reviewed; race not reproduced |
| T-BK-12 | P1 | Admin had no way to cancel or refund a booking. A partial refund in the Stripe dashboard left the dates blocked on both sites. | **Default taken.** Admin → Bookings shows status and total, and has a Cancel control with the policy refund pre-selected. | UA-cancel-1..3, C1–C9, PR1–PR3 |
| T-BK-13 | P2 | The payment form showed success for "processing" payments (bank transfers). | Fixed. After Q3, checkout requests cards only (Apple/Google Pay included). | code, H4b |
| T-BK-15 | P2 | (review) A property still on the schema's "Europe/London" default timezone would reject same-day evening bookings and send the door code a day early. | Fixed. One shared rule gives each property its real timezone. | unit |
| T-BK-16 | P2 | (review) Releasing an "unpaid" hold whose payment had just gone through, and a refund racing its own webhook. | Fixed. Stripe is checked first; the refund race returns success. | C10 |
| T-BK-14 | P3 | The guest count is not stored on the booking. | Parked (schema). | — |

## Emails

| ID | Sev | Problem | Status | Evidence |
|---|---|---|---|---|
| T-EM-13 | **P0** | Welcome and 24h emails could show **fake contacts** from the old seed: 555 phone numbers, "Priya / Slack #host-support", "Share property code 8821", links to non-existent pages. | Fixed. Those values are ignored wherever they are read. **Also check Admin → Details in production** (HUMAN-TASKS). | re-rendered emails with the fake data present |
| T-EM-07 | P1 | Door-code email invented details: backup lockbox "7711", propane cover, elk, a "rotating smart lock", a photo-ID check. | Fixed. Built only from saved codes, parking and Wi-Fi. | E6 |
| T-EM-01 | P1 | Two overlapping daily runs sent the same email twice. | Fixed. Each send is claimed first. | E4, E7 |
| T-EM-03 | P1 | If confirmation emails failed (Postmark down, timeout), they were never retried. | Fixed. The daily run catches them up. | M1–M3 |
| T-EM-04 | P1 | A cancellation plus its refund sent the guest two conflicting emails. | Fixed. | C5 |
| T-EM-05 | P1 | A guest refunded because their dates were taken got no explanation. | Fixed. | L7 |
| T-EM-06 | P1 | Every card decline at checkout emailed the guest an "action required" link that couldn't take payment. | **Default taken.** No email; the form already shows the decline. | P1 |
| T-EM-08 | P1 | Times came from a global profile. Checkout could read "00:00". "Checkout tomorrow" was sent on checkout day. | Fixed. Per-property times with 3 p.m./10 a.m. defaults. | email renders |
| T-EM-09 | P1 | Receipt showed a flat $20 fee and folded taxes into "nightly". | Fixed. It is itemised when it matches the amount charged. | H13, H14 |
| T-EM-10 | P2 | Message notification emails linked to pages that don't exist. | Fixed. | code |
| T-EM-11 | P1 | Host cancellation and refund alerts went to `hosts@bunks.com`. | Fixed. They go to the property support email or alissa@. | C6 |
| T-EM-12 | P1 | A guest booking on the day of check-in got no door code until the next morning. | Fixed. It is sent at payment. | LM1–LM4 |
| T-EM-14 | P2 | Steamboat-only copy (hot tub, low 30s, cabin, security keypad, concierge locker) went to Summerland guests too. | Fixed. | email renders |
| T-EM-15 | P2 | Cancelling an unpaid, abandoned checkout emailed the guest "Cancellation confirmed $0". | Fixed. | C9 |
| T-EM-02 | P1 | The marketing email had no postal address (a US CAN-SPAM requirement). | Fixed. Added Bunks LLC, 144 E Carrillo St, Santa Barbara, CA 93101 (the address in the privacy policy). | code |

## Security

| ID | Sev | Problem | Status | Evidence |
|---|---|---|---|---|
| T-SEC-01 | P1 | No rate limits on admin login, trip lookup (door codes), checkout or Wi-Fi sign-up. | Partly fixed: per-IP limits, but per server instance. See HANDOFF Q5. | unit |
| T-SEC-02 | P2 | 5-character booking references plus a known email can be brute-forced to reach door codes. | Mitigated by the rate limits. Longer references are parked. | — |
| T-SEC-03 | P2 | Guest CSV export allowed spreadsheet formula injection. | Fixed. | WL5 |
| T-SEC-04 | P2 | Wi-Fi sign-up accepted a 5,000-character name and returned internal user ids. | Fixed. | WL2, WL4 |
| T-SEC-05 | P2 | Guest name was inserted unescaped into an ops alert email's HTML. | Fixed. | code |
| T-SEC-06 | P2 | The retired guest chat API still accepted messages and emailed the host. | Fixed. Returns 410 (use email). | GM1, GM2 |
| T-SEC-07 | P2 | Admin emails were hard-coded; config could add admins but not remove them. | Fixed after Q6. `ADMIN_EMAILS` in Vercel is now the full list; the code fallback is ali@, matt@ and alissa@. | HUMAN-TASKS 1c |
| T-SEC-08 | P2 | The seed script could overwrite live settings and contained an Airbnb calendar link. | Fixed. It refuses non-local databases. The old link is still in git history. | manual run |
| T-SEC-09 | P3 | The Wi-Fi password is in the page source before the email is entered. | Won't fix. The gate is a convenience, not security. | — |

## UI and admin

| ID | Sev | Problem | Status | Evidence |
|---|---|---|---|---|
| T-UI-03 | P1 | Public pages ignored Wi-Fi, check-in/out times, parking and house rules saved in Admin → Setup, and showed hard-coded values instead. | Fixed. Setup wins; up to 5 minutes of caching. | WF1 |
| T-UI-01 | P2 | Calendar days had no screen-reader labels. | Fixed. | used by all UI tests |
| T-UI-02 | P3 | "$412 / night" on the property page is the all-in average, which isn't obvious. | Added "$1,647 total for 4 nights, incl. fees and taxes". | UB4 |
| T-UI-04 | P3 | Admin check-in placeholder said 4 PM; everything else defaults to 3 PM. | Fixed. | — |

## Build and infrastructure

| ID | Sev | Problem | Status | Evidence |
|---|---|---|---|---|
| T-BLD-01 | P1 | Three booking routes had route types that fail Next 16's build type check (seen in the local webpack build). | Fixed. `qa/harness/build-check.sh` runs the production build offline. | build passes |
| T-INF-01 | P2 | `prisma/migrations` is out of sync with `schema.prisma`, so the database schema is managed outside migrations. | Parked. Document before adding any schema change. | `prisma migrate diff` |
