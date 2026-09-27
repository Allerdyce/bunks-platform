# Things only you can do (before Oct 1)

Updated after your answers to Q1–Q7 (27 Sep). Work through the tasks in order and tick each box as you go. **Bold** tasks block a safe launch.

## 0. Steamboat codes (owner is keeping them)

- [ ] **Check Admin → Setup (Steamboat) matches the codes printed in the guides.** The trip page shows what's in Setup; the PDFs show what's printed. They should agree:
  - Garage 0409
  - Lockbox 1009
  - Ski locker: door 47754, locker #36, locker code 2482
  - Wi-Fi: Townhouse2 / Steamboat
- [ ] The brochure's first page says "10am Check-in time"; everything else says 3 p.m. check-in, 10 a.m. checkout. Worth fixing when it's next re-exported.
- The guides open only for paid guests (trip page and emails) and for admins (Admin → Setup → Guide/Brochure links). Until this deploys, they're still public at bunks.com.

## 1. Vercel environment variables

Where: vercel.com → bunks-platform (the Allerdyce project, not the old `bunks` one) → Settings → Environment Variables. For each variable:
1. Press **Add New**.
2. Tick **Production** and **Preview**.
3. Save.

When all of 1a–1c are done, redeploy once (step 1d).

- [ ] **1a. Check `CRON_SECRET` exists.**
  - If it's missing, add it with any long random value, e.g. from 1Password's generator or `openssl rand -hex 32`.
  - Without it, the daily jobs refuse to run in production: no reminder or door-code emails, and no daily Airbnb import or failure alert.
- [ ] **1b. Add `ICAL_FEED_SECRET`** (Q4). Use a **new** long random value, generated the same way as 1a. It must not be the same as any other secret.
  - This changes your Bunks calendar link. That's fine, because Airbnb hasn't imported it yet (task 3c).
  - Do 1b before 3c. If Airbnb has already imported the old link, paste the new link from Admin → Setup into Airbnb again.
- [ ] 1b2. Optional: add `GUIDE_LINK_SECRET` (another new random value). It signs the guide PDF links in guest emails. Without it, `ADMIN_SESSION_SECRET` is used; changing that secret later would break links in emails already sent (guests can still open the guide from their trip page).
- [ ] **1c. Add `ADMIN_EMAILS`** (Q6) with the value `ali@bunks.com,matt@bunks.com,alissa@bunks.com`.
  - This list is now the full admin list. Adding or removing someone later is just editing it and redeploying.
  - Until it's set, the code falls back to those same three. `trumandavies7@gmail.com` has been removed from the code.
- [ ] **1d. Redeploy.** Deployments → latest Production deployment → ⋯ → Redeploy. Environment changes only apply to new deployments.
- [ ] Leave `EMAIL_SENDING_PAUSED` unset or `true` until marketing is ready (task 7).

## 2. Admin → Details (production)

- [ ] **Clear any made-up contacts** if you see them:
  - phone numbers ending 555-01xx
  - "Priya" or "Slack #host-support"
  - "Share property code 8821"
  - links like `bunks.com/?property=…/door-codes`

  Enter a real phone number or leave the field blank; only the support email is required. The code already hides these exact values from guests, but they shouldn't sit in the database.

## 3. Admin → Setup (each property)

- [ ] **3a. Airbnb calendar link.**
  - Steamboat: replace the old `airbnb.co.uk …?s=` link with the new `?t=` link.
  - Summerland: add its link.
  - Press **Sync now** for each and check that the "upcoming Airbnb nights" count looks right.
- [ ] 3b. Fill in the rest:
  - Guest support email → `alissa@bunks.com`
  - check-in and check-out times
  - Wi-Fi network and password
  - lockbox or garage code
  - parking notes
  - max guests
  - timezone

  These now override the built-in listing text. Blank times fall back to 3:00 PM and 10:00 AM.
- [ ] **3c. Connect Airbnb to Bunks** (after 1b and 1d). Copy each property's **Bunks calendar link** from Setup into Airbnb → Calendar → Availability → Connect calendars → Import.

## 4. Admin → Pricing

- [ ] 4a. Enter the real Airbnb nightly rates (Sun–Thu and Fri–Sat) and the cleaning fee. The stored values are placeholders.
- [ ] 4b. Summerland: add the Transient Occupancy Tax once the rate is confirmed. Steamboat's lodging tax too, if it isn't there yet.

## 5. Stripe dashboard (dashboard.stripe.com, **live mode**)

Checkout now asks Stripe for **cards only** (Q3). Apple Pay and Google Pay are cards, so they still work; bank debits and pay-later can't appear. Nothing to switch off for Bunks. Two checks:

- [ ] **5a. Webhook events.**
  - Where: Developers → Webhooks → the endpoint ending `/api/stripe`.
  - Make sure it sends exactly these three events:
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
    - `charge.refunded`
  - To fix it: ⋯ → Update details → Select events.
- [ ] 5b. Wallets.
  - Where: Settings → Payments → Payment methods.
  - Leave **Cards**, **Apple Pay** and **Google Pay** on.
  - Apple Pay also needs the domain verified: Settings → Payments → Payment method domains → add `bunks.com` (and `www.bunks.com`, if you use it).

## 6. Neon (production database)

- [ ] **Delete the test booking before connecting Airbnb (task 3c):**
  `DELETE FROM "Booking" WHERE "publicReference" = 'TESTA';`

## 7. Later / optional

- [ ] Airbnb: the old Steamboat export link (`…?s=fbedfa…`) is in this repo's git history. If it still works, Airbnb's **Reset link** makes it useless to anyone who has the repo. Then paste the new link into Setup (task 3a).
- [ ] When you're ready for marketing email, set `EMAIL_SENDING_PAUSED=false`. The postal address is already in the footer (Bunks LLC, 144 E Carrillo St, Santa Barbara).
- [ ] Rate limits (Q5): nothing to do for launch. If you see abuse, tell me and I'll set up Upstash.

## Your rulings (27 Sep)

Q1 pause checkout when the Airbnb calendar can't be read: **yes**. Q2 cancellation policy: **confirmed**. Q3 cards and wallets only: **yes, now enforced in code**. Q4 separate calendar secret: **yes** (task 1b). Q5 rate limits: **launch as-is**. Q6 admins: **ali@, matt@, alissa@, list managed in Vercel** (task 1c). Q7 60 nights / 2 years: **keep**.
