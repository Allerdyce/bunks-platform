# Bunks launch checklist: things only you can do

Updated 2 Oct 2026. [x] = done and confirmed. [ ] = still to do. Do the sections in order.
**Bold** items affect guests or money, so do those first.

---

## Already done (no action)

- [x] Privacy fix is live: addresses, Wi-Fi and the guide PDFs are no longer public. You confirmed `/Steamboat%20Brochure.pdf` says "not found".
- [x] Vercel: `ICAL_FEED_SECRET` and `PRICE_CHECK_SECRET` added and redeployed. The Bunks calendar links changed as expected.
- [x] GitHub: repository secrets `PRICE_CHECK_SECRET` and `BUNKS_BASE_URL` added.
- [x] Airbnb → Bunks calendars: Steamboat (1 Airbnb link) and Summerland (2 Airbnb links, including Briggs Direct). Live check on 28 Sep: 0 differences for both homes.
- [x] Bunks → Airbnb calendars: "Bunks direct" imported into all 3 Airbnb listings, confirmed by Airbnb on 27 Sep.
- [x] Tax check: Airbnb shows taxes as a separate line after the price, so the price check compares before tax. Nothing to set.
- [x] Price check code merged. The twice-daily schedule is still off (see section 6).

---

## 1. Pricing: blocks correct charges (do first)

**1a. Real nightly rates**
1. Go to bunks.com/admin → **Pricing**.
2. Steamboat: enter the real **Sun–Thu rate**, **Fri–Sat rate** and **cleaning fee**. It's currently on the $350 placeholder.
3. Summerland: same three values.
4. Save each one.
5. Check: open bunks.com/property/steamboat-downtown-townhome, pick a 3-night stay, and confirm the nightly price is 10% below your rate.

Enter the price you charge on Airbnb. Bunks takes 10% off it automatically and adds its 5% service fee.

**1b. Taxes**
1. Admin → **Pricing** → Summerland → add **Transient Occupancy Tax** at the confirmed rate, applied to nightly and cleaning.
2. Steamboat: check a lodging tax is listed. If not, add it.
3. Check: a quote should now show a tax line.

Without these, guests pay no tax at checkout.

---

## 2. Stripe (dashboard.stripe.com, toggle **Live mode** on, top right)

**2a. Webhook events**
1. Developers → **Webhooks** → click the endpoint ending in `/api/stripe`.
2. Check "Listening to" shows exactly these three:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
3. If not: ⋯ → **Update details** → **Select events** → tick those three → **Update endpoint**.

Without this, paid bookings never confirm and guests get no confirmation email.

**2b. Apple Pay domain**
1. Settings → Payments → **Payment method domains** → **Add a new domain**.
2. Add `bunks.com`, then add `www.bunks.com`.
3. Both should show as verified.

**2c. Wallets**
Settings → Payments → **Payment methods**: leave **Cards**, **Apple Pay** and **Google Pay** on. Checkout asks for cards only, so nothing else needs switching off.

---

## 3. Vercel: confirm the last two settings

Go to vercel.com → **bunks-platform** (the Allerdyce project) → Settings → **Environment Variables**.

- [ ] **3a. `CRON_SECRET`.** Check it is listed. If it's missing:
  1. Run `openssl rand -hex 32` in Terminal.
  2. Press **Add New**, enter key `CRON_SECRET` and that value, tick **Production** and **Preview**, turn on **Sensitive**, and **Save**.

  Without it there are no reminder or door-code emails, and no daily calendar backstop.
- [ ] **3b. `ADMIN_EMAILS`.** Check it is listed with the value `ali@bunks.com,matt@bunks.com,alissa@bunks.com`. If it's missing, add it the same way (Sensitive not needed).
- [ ] 3c. Optional: `GUIDE_LINK_SECRET` (another `openssl rand -hex 32` value). It signs the guide-PDF links in guest emails.
- [ ] 3d. **If you added or changed anything above:** Deployments → top **Production** deployment → ⋯ → **Redeploy**.
- Leave `EMAIL_SENDING_PAUSED` unset or `true` until marketing is ready (section 8).

---

## 4. Bookings and data cleanup

**4a. Test booking #45 (Summerland, 28 Sep → 1 Oct)**
1. Admin → **Bookings** → find the Summerland stay for **Sep 28 → Oct 1**.
2. Look at the guest name and email.
   - **If it's your test** ("TESTA" or your own email): press **Cancel** → choose **No refund** → confirm. This removes it from the calendar Airbnb reads. It doesn't touch Stripe.
   - **If it's a real guest:** don't cancel. Tell Claude, because it overlaps an Airbnb reservation.

**4b. Admin → Details: remove made-up contacts**
1. Admin → **Details**, for each home.
2. Delete any of these:
   - phone numbers ending 555-01xx
   - "Priya" or "Slack #host-support"
   - "Share property code 8821"
   - links like `bunks.com/?property=…/door-codes`
3. Enter a real phone number or leave the field blank. Only the support email is required.
4. Save.

---

## 5. Admin → Setup: each home's guest details

Go to bunks.com/admin → **Setup**, one card per home. Fill in, then **Save**:

| Field | Steamboat | Summerland |
|---|---|---|
| Guest support email | `alissa@bunks.com` | `alissa@bunks.com` |
| Check-in / check-out | 3:00 PM / 10:00 AM (or your real times) | your times |
| Wi-Fi network / password | Townhouse2 / Steamboat | Lillie Ave Guest / Welcome! |
| Garage code | 0409 | (if any) |
| Lockbox code | 1009 | (if any) |
| Ski locker | door 47754, locker #36, code 2482 | — |
| Parking notes | your text | your text |
| Max guests | 6 | 8 |
| Timezone | America/Denver | America/Los_Angeles |

- The trip page shows guests exactly what's in Setup, 24 hours before check-in. The codes must match the printed guides; the owner is keeping these codes.
- Then press **Check calendars** on each card. You want the green result.

**5b. Summerland's two Airbnb listings aren't linked to each other on Airbnb**
- If both are the same house and both take bookings, a booking on one doesn't block the other on Airbnb.
- Listing 657758541446156325 is connected to property management software. Check in that software that it syncs both Summerland listings.
- If it doesn't: in Airbnb, import each listing's export link into the other (Calendar → Availability → Connect calendars).

---

## 6. Airbnb price check: first real run, then turn on the schedule

1. Wait until any Vercel deploy shows **Ready**.
2. Go to github.com/Allerdyce/bunks-platform → **Actions** → **Airbnb price check** (left list).
   - Use the **Run workflow** dropdown on the right.
   - Do **not** use "Re-run all jobs": a re-run repeats the old dry-run settings.
3. Branch: **main**. **Untick `dry_run`**. Click the green **Run workflow**.
4. The new run (#2 or later) should take about 1–2 minutes and turn green.
5. Check the alert inbox (alissa@bunks.com) for **"Price check: …"**. It has a table of every stay: Bunks price, Airbnb price and the saving.
   - Rows in red are below the 5% target, which is expected until section 1 is done.
   - "Airbnb quote failed" or "blocked" rows: send Claude the email.
   - A red workflow or no email: send Claude a screenshot of the **price-check** job log.
6. When a run looks right, tell Claude to **turn on the twice-daily schedule** (8 am and 8 pm Pacific).
7. Optional: change the 5% target with `PRICE_CHECK_MIN_SAVINGS_PCT` in Vercel, then redeploy.

---

## 7. Optional: prove a real payment end to end

1. On bunks.com, book a 3-night stay on dates you don't mind blocking, using **your own card**.
2. Check:
   - the confirmation and receipt emails arrive
   - the booking shows **Paid** in Admin → Bookings
   - My Trips shows the address and Wi-Fi
3. Admin → Bookings → **Cancel** → **Full refund** → confirm. Check the refund appears in Stripe.

Airbnb blocks those dates until it next reads the Bunks calendar (a few hours), so choose dates you're unlikely to sell on Airbnb that day.

---

## 7b. Wi-Fi welcome email (draft, paused)

Sent the first time a guest unlocks the Wi-Fi on a home's in-home QR page: photo, Wi-Fi details, house guide (Summerland: the guidebook PDF; Steamboat: the trip page, because its guides print the door codes), book-direct link.
- [ ] Review it in Admin → Emails → **Wi-Fi Welcome** (preview / send yourself a sample).
- [ ] To turn it on: Vercel → add `EMAIL_UNPAUSED_TEMPLATES` = `wifi-welcome` → Redeploy. Remove it to pause again.

## 8. Later

- [ ] Re-export the Steamboat brochure PDF: page 1 says "10am Check-in", but check-in is 3 pm. Send Claude the new file when it's ready.
- [ ] Marketing email: when ready, set `EMAIL_SENDING_PAUSED=false` in Vercel and redeploy. The postal address is already in the footer.
- [ ] Airbnb's old Steamboat export link (`…?s=fbedfa…`) is in the code history. Airbnb's **Reset link** makes it useless. If you reset it, paste the new export link into Admin → Setup → Steamboat.
- [ ] Rate limits: nothing to do unless you see abuse, then tell Claude (Upstash).

---

## Your rulings (27 Sep)

| | |
|---|---|
| Q1 | Pause checkout if Airbnb can't be read: **yes** |
| Q2 | Cancellation policy: **confirmed** |
| Q3 | Cards and wallets only: **yes** |
| Q4 | Separate calendar secret: **yes, done** |
| Q5 | Rate limits: **launch as-is** |
| Q6 | Admins: **ali@, matt@, alissa@, managed in Vercel** |
| Q7 | 60 nights / 2 years: **keep** |
| Owner | Keep the Steamboat codes; the guides are visible only on the trip page and in admin |
| Pricing | Airbnb quotes are a comparison check only; Bunks prices come from Admin → Pricing |
