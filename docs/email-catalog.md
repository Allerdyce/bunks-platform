# Bunks Email Catalog

Comprehensive inventory of every transactional email the platform must support. Use this document as the product source of truth for requirements, triggers, and implementation status. The data mirrors `src/lib/email/catalog.ts`.

## Legend
- **Audience:** Guest, Host, or System
- **Status:**
  - `shipped` — template + send helper live
  - `in-progress` — template scaffolded, not wired
  - `planned` — requirement captured, work not started
  - `parked` — built but disabled behind a feature flag
- **Trigger:** Event, cron, or manual action that sends the email

## Guest Emails
| # | Email | Trigger | Status |
|---|-------|---------|--------|
| 1 | Booking Confirmation | `payment_intent.succeeded` | shipped |
| 2 | Receipt / Payment Confirmation | Stripe webhook or admin resend | shipped |
| 3 | Booking Details / Welcome Email | Immediately after confirmation | shipped |
| 4 | 48-Hour Pre-Stay Reminder | Cron: 48h before check-in | shipped |
| 5 | 24-Hour Pre-Stay Reminder | Cron: 24h before check-in | shipped |
| 6 | Door Code Delivery | When smart lock code generated | shipped |
| 7 | Add-On Confirmation | When guest adds extras | parked |
| 8 | Mid-Stay Check-In | Cron: morning of day 2 | shipped |
| 9 | Issue / Maintenance Report Confirmation | Guest submits issue form | shipped |
| 10 | Noise Warning / Courtesy Notice | Manual or automation | shipped |
| 11 | Checkout Reminder | Evening before checkout | shipped |
| 12 | Post-Stay Thank You | Within 12h after checkout | shipped |
| 13 | Review Request | 24h after checkout | shipped |
| 14 | Guest Refund Issued | Partial refund processed | shipped |
| 15 | Cancellation Confirmation | Booking cancelled | shipped |
| 16 | Booking Modification Confirmation | Booking change mutation | shipped |
| 17 | No-Show Notification | Booking marked no-show | shipped |
| 18 | Payment Failure / Retry Request | Stripe requires auth | shipped |
| 19 | Hold Deposit Release | Security deposit released | shipped |

## Host Emails
| # | Email | Trigger | Status |
|---|-------|---------|--------|
| 1 | New Booking Alert | Booking marked paid | shipped |
| 2 | Add-On Sold to Guest | Guest adds paid extra | parked |
| 3 | Booking Modification Alert | Booking update | shipped |
| 4 | 3-Day Pre-Arrival Reminder | Cron: 3 days before | shipped |
| 5 | Same-Day Arrival Reminder | Cron: morning of check-in | shipped |
| 6 | Door Code Setup Reminder | Dynamic lock flow | shipped |
| 7 | Damage / Incident Report (Guest) | Guest submits issue | shipped |
| 8 | Cleaner Maintenance Report | Cleaner form submission | shipped |
| 9 | Noise Alert Notification | Noise system event | shipped |
|10 | Checkout Confirmed | Smart lock/cleaner check | shipped |
|11 | Cleaner Assigned / Completed | Cleaner scheduling | shipped |
|12 | Guest Cancelled Booking | Cancellation event | shipped |
|13 | No-Show Guest | Booking flagged no-show | shipped |
|14 | Refund Adjustment Notice | Refund processed | shipped |
|15 | Chargeback / Dispute Alert | Stripe dispute webhook | shipped |
|16 | Welcome to Bunks (Host Onboarding) | Host onboarding complete | shipped |
|17 | Property Verification Update | Ops review milestone | shipped |
|18 | Listing Imported / Ready | Auto-built listing ready | shipped |

## System & Internal Emails
| # | Email | Trigger | Status |
|---|-------|---------|--------|
| 1 | Failed Email Delivery | Postmark bounce webhook | shipped |
| 2 | Stripe Webhook Failed | Webhook error capture | shipped |
| 3 | Booking Creation Failed | API/DB failure | shipped |
| 4 | Cron Summary | Scheduled cron completion | shipped |
| 5 | Major Issue Reported | Guest/host severity flag | shipped |
| 6 | Calendar Sync Error | Airbnb iCal import error | shipped |
| 7 | Payment Exception Detected | Payment anomaly | shipped |

## Next Steps
1. Mirror this catalog in `src/lib/email/catalog.ts` for programmatic access.
2. Extend `/admin/emails` to render every row—even placeholders—so design gaps are obvious.
3. Tackle templates by batch (e.g., guest stay prep, host prep, system alerts) while wiring triggers + logging consistently.
