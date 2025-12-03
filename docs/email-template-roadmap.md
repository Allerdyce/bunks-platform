# Email Template Roadmap

This roadmap prioritizes the next wave of React Email templates beyond the initial five that already ship end-to-end (Booking Confirmation, Host Notification, Pre-Stay 48h, Review Request, Receipt). Each batch groups emails that share data needs, triggers, and reusable blocks so they can be implemented efficiently.

## Guiding Principles
- **Lifecycle coverage first**: ensure every guest touchpoint from booking through checkout has at least a placeholder template.
- **Mirror operational workflows**: templates should unblock automations already defined in the spec (Stripe webhooks, cron jobs, concierge escalations).
- **Re-use components**: share layout sections (invoice tables, itinerary blocks, CTA rows) to keep implementation fast.
- **Preview parity**: every template must render in `/admin/emails` with sample data plus CLI previews.

## Batch 1 — Guest Booking & Receipts (Week 1)
Focus on finishing the booking lifecycle so guests immediately receive everything they expect post-purchase.

| Template | Status Goal | Dependencies | Notes |
| --- | --- | --- | --- |
| `receipt` | ✅ Ship (wire send helper) | existing template, finalize sendReceipt helper + Stripe payload | Already scaffolded UI; just hook to webhook + admin resend.
| `booking-details-welcome` | ✅ Ship (template + helper) | sample booking data, house rules copy | React Email template + helper live; wired to Stripe webhook.
| `pre-stay-24h` | ✅ Ship (template + helper) | itinerary data, weather/service info | Template + helper done with cron-ready entry point.
| `door-code-delivery` | ✅ Ship (template + secure send) | smart-lock code service | React Email template, helper, previews, and catalog shipped Nov 21; trigger pending lock automation.
| `add-on-confirmation` | ✅ Ship (template + helper) | add-on purchase payloads | Guest-facing confirmation covering schedule, providers, billing snapshot, and concierge CTA; waiting on add-on API wiring.

**Deliverables**
1. React Email components (`src/emails/*`).
2. Sample props in `src/lib/email/sampleData.ts`.
3. Send helpers under `src/lib/email/*` + exports in catalog manifest.
4. Trigger wiring: Stripe webhook for receipt, cron jobs/hooks for others.
5. Preview coverage (admin page + `npm run preview:emails`).

**Progress:** Receipt, Booking Welcome, Pre-Stay 24h, Door Code Delivery, Add-On Confirmation, Mid-Stay Check-In, Issue Report Confirmation, Checkout Reminder, Post-Stay Thank You, and Guest Refund Issued templates shipped (Nov 21, 2025). Cancellation Confirmation shipped Nov 22, 2025 with policy snapshot + rebooking CTA. Failed Email Delivery, Stripe Webhook Failed, Booking Creation Failed, Cron Summary, Major Issue Reported, Calendar Sync Error, Payment Exception Detected, Host 3-Day Pre-Arrival Reminder, Host Same-Day Arrival Reminder, Host Door Code Setup Reminder, and Host Damage Report shipped Nov 22–23, 2025 so ops + hosts now have bounce, webhook, booking, cron digest, safety, iCal recovery, finance reconciliation, staffing playbooks, and real-time incident digests with cost estimates. Stripe webhook currently wires receipt + welcome; 24h reminder helper ready for cron hook; door-code helper awaits lock automation trigger; add-on confirmation helper awaits checkout hook after add-on API lands; mid-stay helper awaits Day-2 cron hookup; issue confirmation helper is ready once the issue-reporting API posts ticket payloads; checkout reminder helper will plug into the evening-before-checkout cron; thank-you helper will be tied to the post-checkout cron once ready.

**Nov 30, 2025 update:** Completed the remaining host/system parity templates (Host Add-On Sold, Host Booking Modified, Host Cleaner Report, Host Noise Alert, Host Checkout Confirmed, Host Cleaner Assigned, Host Guest Cancelled, Host No-Show, Host Refund Adjustment, Host Chargeback, Host Onboarding Welcome, Host Verification Progress, and Host Listing Ready) along with their Postmark helpers + logging. Sample data, preview coverage, and catalog/docs entries are now being wired so `/admin/emails` stays in sync with the manifest.

**Dec 2, 2025 update:** The Viator add-on marketplace is temporarily disabled for launch, so `add-on-confirmation` and `host-add-on-sold` are marked `parked` in the catalog. Their send helpers short-circuit unless the `addons` feature flag is forced on for QA.

## Batch 2 — Guest During/Post-Stay (Week 2)
Ensure guests are guided through their stay and nudged politely for reviews.

| Template | Status Goal | Dependencies | Notes |
| --- | --- | --- | --- |
| `mid-stay-check-in` | ✅ Ship (template + helper) | booking + concierge contact details | Concierge check-in email with focus list, upsells, and support CTA shipped Nov 21; cron trigger pending.
| `issue-report-confirmation` | ✅ Ship (template + helper) | booking issue form payload | Template, helper, previews, and catalog/docs shipped Nov 21; hook to issue API next.
| `checkout-reminder` | ✅ Ship (template + helper) | cleaning checklist, lock instructions | Template + helper + previews shipped Nov 21; cron wiring next.
| `post-stay-thank-you` | ✅ Ship (template + helper) | referral program copy | Template + helper + previews complete Nov 21; cron wiring next.

## Batch 3 — Host Prep & Alerts (Week 3)
Give hosts parity by keeping them informed before, during, and after guest stays.

| Template | Status Goal | Dependencies | Notes |
| --- | --- | --- | --- |
| `host-prep-3-day` | ✅ Ship (template + helper) | housekeeping schedule, ops notes | Align with guest stay details for staffing.
| `host-prep-same-day` | ✅ Ship (template + helper) | arrival ETA, notes | Same-day host digest with timeline, alerts, and helper ready for cron wiring.
| `host-door-code-reminder` | ✅ Ship (template + helper) | dynamic lock workflows | Lock status dashboard, access codes, fallback plans, and helper ready for automation hooks.
| `host-damage-report` | ✅ Ship (template + helper) | guest issue payload + media links | Inline damage digest with photo links, estimates, and helper ready for incident pipeline.
| `host-cleaner-report` | 🆕 Template + cleaner app hook | cleaner submission schema | Capture before/after notes and photos.

## Batch 4 — Edge Cases & System Alerts (Week 4)
Round out operational coverage for cancellations, refunds, and internal monitors.

| Template | Status Goal | Dependencies | Notes |
| --- | --- | --- | --- |
| `cancellation-confirmation` | ✅ Ship (template + helper) | booking mutation hook | Covers refund policy summary + rebooking CTA.
| `guest-refund-issued` | ✅ Ship (template + helper) | Stripe refund metadata | Ready for finance hook + host parity email next.
| `system-email-failed` | ✅ Ship (template + helper) | Postmark webhook | Routes bounce metadata to ops distro.
| `system-stripe-webhook-failed` | ✅ Ship (template + helper) | Webhook error handler | Includes remediation checklist + replay CTA.
| `system-booking-creation-failed` | ✅ Ship (template + helper) | Booking API failure hook | Alerts ops to orphaned payments + missing bookings.
| `system-cron-summary` | ✅ Ship (template + helper) | cron result payloads | Digest of reminder/review jobs with backlog + incident callouts.
| `system-major-issue` | ✅ Ship (template + helper) | issue severity pipeline | Escalates critical guest/host incidents with action plan + responders.
| `system-calendar-sync-error` | ✅ Ship (template + helper) | Airbnb iCal ingestion | Warns ops about feed failures + double-booking risk with manual recovery steps.

## Implementation Checklist per Template
1. **Template file** in `src/emails` using shared `EmailLayout`.
2. **Props interface + sample data** for previews.
3. **Send helper** exporting `send{TemplateName}` with typed payload and Postmark send call.
4. **Catalog update** (`src/lib/email/catalog.ts`) marking status + template/service paths.
5. **Trigger wiring** (webhook, cron, manual admin action) plus logging to track deliveries.
6. **Tests/Previews**: verify `npm run preview:emails` output and spot-check via `/admin/emails`.

## Tracking & Reporting
- Use the catalog manifest status field to mark each template as `in-progress` or `shipped` once its helper + trigger are live.
- Document any new cron routes or webhook handlers directly in `docs/email-catalog.md` (append “Integration Notes” section) so ops can reference behavior.
- Surface template coverage stats from the admin gallery (counts already render) to quickly validate weekly goals.
