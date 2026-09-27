# Overnight QA handoff: 27 Sep 2026

Branch `claude/bold-curie-7laxza` is pushed, with **no PR and nothing merged**. It sits on top of the design branch. Nothing touched the live database, the Airbnb calendars, real Stripe or real email; everything ran on a local copy with fakes.

## Needs you (answer in one line each)

**Q1 · Keep "pause checkout if the Airbnb calendar can't be read"?**
- Why it matters: a broken Airbnb link otherwise lets direct guests pay for nights Airbnb already sold.
- Options: A) pause, with a friendly "try again or email us" message plus an alert email (**done, default**). B) take bookings anyway.
- Recommendation: A.
- Reversible: yes, one line.

**Q2 · Is the cancellation policy right?**
- The policy is "full refund 30+ days out, 50% at 7–30 days, none inside 7 days". Guests see it at checkout, and the new admin Cancel button pre-selects the refund it gives.
- Recommendation: confirm it or send the correct wording.

**Q3 · Accept only cards and wallets (Apple/Google Pay)?**
- Bank debits and buy-now-pay-later can stay "processing" for days, longer than the 30-minute date hold.
- Recommendation: yes. It's a Stripe dashboard switch (HUMAN-TASKS #12).
- Reversible: yes.

**Q4 · Set `ICAL_FEED_SECRET` in Vercel to today's `ADMIN_SESSION_SECRET` value?**
- Why: today the Airbnb import link depends on the admin secret, so changing that secret would silently break Airbnb's view of direct bookings.
- Recommendation: yes. The link stays the same.

**Q5 · Rate limits.**
- Tonight added per-server-instance limits on login, trip lookup, checkout and Wi-Fi sign-up. They slow abuse but don't guarantee a global cap.
- Options: A) launch as-is (**default**). B) add a shared store (Upstash, free tier, needs an account).
- Recommendation: A for Oct 1, B if abuse shows up.

**Q6 · Admin logins.**
- Four emails are hard-coded as admins, and settings can add admins but not remove these: ali@, matt@, trumandavies7@gmail.com, alissa@. All share one password.
- Should all four keep access?
- Recommendation: move the list to a Vercel setting.

**Q7 · Stay limits.**
- Online bookings are capped at 60 nights and 2 years ahead; longer stays are asked to email.
- Recommendation: keep.
- Reversible: yes.

Everything only you can do (settings, Stripe, Vercel, Airbnb): **`qa/HUMAN-TASKS.md`**. The most important are confirming `CRON_SECRET` is set in Vercel (without it no daily emails or Airbnb import run) and clearing placeholder contacts in Admin → Details.

## Reversal of my own earlier fix

The audit suggested that a guest paying after their 30-minute hold expired should lose to another guest's active hold. I built that. An independent review then showed it could **refund a guest who had paid in favour of someone who never pays**. I reverted to "a completed payment wins". The other guest, if they pay later, is refunded automatically and emailed why (tests X1–X3).

## What was wrong (worst first)

1. **A cut-off or empty Airbnb feed deleted every Airbnb block**, which opens the door to double bookings. Fixed: incomplete feeds are rejected, and an empty feed needs admin confirmation.
2. **Guest emails could show made-up contacts**: 555 phone numbers, "Priya / Slack", "property code 8821", dead links. These came from old seed data that may be in production. Fixed in code; please also check Admin → Details.
3. **The door-code email invented details** (a backup lockbox "7711", a propane cover, elk). It is now built only from what's saved in Setup.
4. **Admin couldn't cancel or refund at all.** A partial refund in Stripe left the dates blocked on both sites. Added a Cancel control in Admin → Bookings.
5. **Admin Setup values were ignored on public pages** (Wi-Fi, check-in times, parking). The page showed the hard-coded password "Steamboat" whatever you saved.
6. Other fixed problems:
   - Duplicate emails when daily runs overlap.
   - Lost confirmations were never retried.
   - Two emails for one cancellation.
   - No door code for same-day bookings.
   - Receipt listed a $20 flat fee.
   - Checkout summary showed wrong math after an error.
   - A typo'd refund cancelled with $0.
   - Timezone and DST slips.
   - Raw JSON shown to guests.

My own mistakes along the way, both caught by tests before pushing:
- My first duplicate-email guard stopped senders from sending at all.
- My first "empty feed" guard also paused checkout. The review caught it and it's fixed.

The full list is 58 tickets, each with status and the test that proves it: **`qa/TICKETS.md`**.

## Evidence

| Suite | Result | File |
|---|---|---|
| End-to-end booking scenarios (API, local database, fake Stripe/Airbnb) | 77/101 before → **135/135** | `qa/results/e2e-baseline.json`, `e2e-final.json` |
| Browser tests: desktop and phone, Tokyo/Honolulu/London guests, admin | **50/50** | `qa/results/ui-final.json` |
| Unit tests × 4 server timezones | **17/17 each** | `qa/results/unit-final.txt` |
| Production build (offline, webpack) | **passes** | `qa/results/build-final.log` |

Not verified:
- Real Stripe, Postmark delivery and a live Airbnb feed. These were mocked, with the fake feed modelled on Airbnb's format.
- Vercel's own build of the latest commit, because there's no PR to show its status.
- Screenshots were reviewed by me; they are not saved in the repo.

## Workstreams

- Booking and payment: **90%**. Left: guest count isn't stored (needs a schema change).
- Calendar sync: **90%**. Left: Airbnb's own polling delay can't be removed, only alerted on.
- Emails: **85%**. Left: postal address for marketing; the paused templates weren't re-tested.
- Security: **70%**. Left: Q5 and Q6, and longer booking references.
- Admin: **85%**.
- Test harness: **done**. Instructions are in `qa/harness/README.md`; it isn't wired into CI.
- Migrations: **0%**. `prisma/migrations` has drifted from the schema; document how production is migrated before any schema change.

## Next

Once you've answered, I'll apply your rulings. Then I'd open a PR from this branch into the design branch so Vercel builds a preview, where you can click through with Stripe test keys.
