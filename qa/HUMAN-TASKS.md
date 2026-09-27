# Things only you can do (before Oct 1)

Each item is a setting in an admin screen or a service dashboard. None of these were changed tonight. Items in **bold** block a safe launch.

## Vercel → bunks-platform → Settings → Environment Variables (Production)

1. **Confirm `CRON_SECRET` is set** (any long random value).
   - Without it, both daily jobs refuse to run in production: no reminder or door-code emails, and no daily Airbnb import or failure alert.
2. Set `ICAL_FEED_SECRET` to the **same value** your `ADMIN_SESSION_SECRET` has today (see HANDOFF Q4).
   - The Bunks calendar link you paste into Airbnb then stays the same.
   - Changing the admin secret later won't break the link.
3. Leave `EMAIL_SENDING_PAUSED` unset or `true` until marketing is ready (item 12).

## Admin → Details (production)

4. **Open the page and clear any made-up contacts** if you see them: phone numbers ending 555-01xx, "Priya", "Slack #host-support", "Share property code 8821", or links like `bunks.com/?property=…/door-codes`.
   - Tonight's code already hides these exact values from guests, but they shouldn't sit in the database.
   - Enter a real phone number or leave the field blank. Only the support email is required now.

## Admin → Setup (each property)

5. Airbnb calendar link:
   - Steamboat: replace the old `airbnb.co.uk …?s=` link with the new `?t=` one.
   - Summerland: add its link.
   - Press **Sync now** for each and check that the "upcoming Airbnb nights" count looks right.
6. Guest support email → `alissa@bunks.com` for both properties.
7. Check-in and check-out times, Wi-Fi network and password, lockbox or garage code, parking notes, max guests and timezone.
   - Blank times fall back to 3:00 PM and 10:00 AM everywhere.
   - These now override the built-in listing text, so fill in what's true.
8. Copy each **Bunks calendar link** into Airbnb → Calendar → Availability → Connect calendars → Import.

## Admin → Pricing

9. Enter the real Airbnb nightly rates (Sun–Thu and Fri–Sat) and cleaning fee. The stored values are placeholders.
10. Summerland: add the Transient Occupancy Tax once the rate is confirmed. Steamboat's lodging tax too, if it isn't there yet.

## Stripe dashboard

11. Developers → Webhooks → your production endpoint `…/api/stripe` must send these 3 events:
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
    - `charge.refunded`
12. Settings → Payment methods: turn off bank debits (ACH) and buy-now-pay-later (see HANDOFF Q3).

## Neon (production database)

13. Delete the test booking before connecting the Airbnb import:
    `DELETE FROM "Booking" WHERE "publicReference" = 'TESTA';`

## Airbnb

14. Optional: the old Steamboat export link (`…?s=fbedfa…`) is in this repo's git history. If it still works, Airbnb's "Reset link" makes it useless to anyone who has the repo, and then you paste the new link into Admin → Setup.

## Before turning on marketing email

15. Add a postal address to the marketing footer (a US CAN-SPAM requirement), then set `EMAIL_SENDING_PAUSED=false`. Send me the address and I'll add it.
