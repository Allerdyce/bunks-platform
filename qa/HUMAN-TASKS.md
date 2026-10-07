# Bunks: things only the owner can do

Updated 6 Oct 2026. [x] = done. [ ] = still to do. **Bold** items affect guests, money or security.

Door codes, Wi-Fi and addresses live in Admin → Setup, never in this file: the repo has been public.

---

## Done

- [x] Guest privacy: addresses, Wi-Fi and the guide PDFs are no longer public on the website.
- [x] Calendars: Airbnb → Bunks for both homes (Summerland has 2 Airbnb links, including Briggs Direct), and the Bunks export imported into all 3 Airbnb listings.
- [x] Stripe is live: webhook, Link off, payouts set up. A $1 live booking went through on 6 Oct.
- [x] Airbnb pricing is on: the twice-daily price check sets Bunks' nightly rates from Airbnb (`AIRBNB_GUEST_FEE_PCT=0`).
- [x] Emails: guests get 3 per stay (confirmation with receipt, arrival details, checkout reminder); Stripe's own receipt is off.
- [x] Private payment links (Admin → Bookings → New private booking).

---

## 1. Security (from the 6 Oct audit)

- [ ] **Make the GitHub repo private:** github.com/Allerdyce/bunks-platform → Settings → General → Danger Zone → Change visibility → Private. Vercel keeps deploying.
- [ ] **Admin passwords:** give each admin their own password (`node scripts/admin-password.mjs`, see the README), then delete the shared `ADMIN_PASSWORD` in Vercel and redeploy. The old shared password is in the public code history.
- [ ] **Reset Steamboat's Airbnb export link** (the old one is in the code history): Airbnb → Steamboat → Calendar → Availability → Export → Reset link, then paste the new link into Admin → Setup → Steamboat.
- [ ] Revoke the two old PriceLabs API keys in PriceLabs, if that account still exists.

---

## 2. Still to confirm (open since 2 Oct)

- [ ] Vercel has `CRON_SECRET` (without it there are no arrival or checkout emails and no daily calendar backstop) and `ADMIN_EMAILS` = `ali@bunks.com,matt@bunks.com,alissa@bunks.com`.
- [ ] Test booking #45 (Summerland, 28 Sep → 1 Oct): if it's your test, cancel it with no refund in Admin → Bookings. If it's a real guest, tell Claude: it overlaps an Airbnb reservation.
- [ ] Admin → Details: delete any made-up contacts (phone numbers ending 555-01xx, "Priya", "Slack #host-support", "property code 8821").
- [ ] Admin → Setup, each home: support email, check-in/out times, Wi-Fi, codes, parking notes, max guests, timezone. Guests see exactly this on the trip page from 24 hours before check-in. Then press **Check calendars** on each card.
- [ ] Summerland's two Airbnb listings: if both take bookings for the same house, check they block each other (the property management software, or import each listing's export link into the other).
- [ ] Re-export the Steamboat brochure PDF: page 1 says "10am Check-in", but check-in is 3 pm.

---

## 3. Later

- [ ] Marketing email: when ready, set `EMAIL_SENDING_PAUSED=false` in Vercel and redeploy.
- [ ] Rate limits: nothing to do unless you see abuse, then tell Claude.

---

## Your rulings

| | |
|---|---|
| Checkout when Airbnb can't be read | Paused |
| Cancellation policy | Confirmed |
| Payment methods | Cards and wallets only; Link off |
| Admins | ali@, matt@, alissa@, managed in Vercel |
| Stay limits | 60 nights max, up to 2 years ahead |
| Steamboat codes | Kept; shown only on the trip page and in admin |
| Pricing | Airbnb sets the nightly rate; cleaning is $250 for both homes, always on top (6 Oct) |
| Guest emails | 3 per stay (6 Oct) |
