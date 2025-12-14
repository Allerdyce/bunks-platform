Guest Journey Email Edits:


24-Hour Pre-Stay Reminder:
https://bunks.com/guides/summit-ridge
I don't think that is the URL to the guide?
http://localhost:3000/guide//summit-ridge is a broken link

---

48-Hour Pre-Stay Reminder:
## Guest Journey Email QA Checklist

Use this backlog to keep the transactional email system production-ready. Each bullet captures a concrete fix or validation task for the templates listed below.

### 24-Hour Pre-Stay Reminder
- Update the guide CTA to use the public URL (`https://bunks.com/guides/summit-ridge`) instead of the broken local link.
- De-duplicate the “Open updated instructions” and “Browse recommendations” CTAs—only show the anchor jump if we can deep-link straight into the recommendations section.

### 48-Hour Pre-Stay Reminder
- Ensure the two CTAs reference distinct destinations (instructions vs. guide anchor). If they intentionally point to the same section, consolidate into a single CTA with clearer copy.

### Booking Confirmation
- “Check-in instructions” / “Open check-in guide” / “Guest Book” currently resolve to the same URL. Collapse these into one well-labeled block and CTA so guests aren’t confused by redundant buttons.

### Booking Details / Welcome Email
- Add spacing between the info cards—text currently touches the borders and adjacent cards.

### Booking Modification Confirmation
- Define the target for “View booking details →” (likely `/property/[slug]?view=booking-details` with query params). Hide the CTA until that destination is implemented.

### Cancellation Confirmation
- Remove add-on specific lines (“Private chef deposit”, “Kitchen already sourced ingredients”) until we sell those add-ons again.

### Checkout Reminder
- Drop the hard-coded weather callout. Replace it with a generic travel buffer tip or pull live data before re-enabling.
- Remove the “Add-on gear to leave out” module, including the baby-gear pickup note, since gear rentals aren’t in the product yet.

### Door Code / Smart Lock Delivery
- Adjust the Parking / Entry steps table so column gutters are consistent and borders line up with the surrounding cards.

### Guest Refund Issued
- Align the status pills (“Issue reported”, “Ops approved refund”, “Funds in transit”) along the top edge so the icons and copy don’t appear staggered.

### Mid-Stay Check-In
- Replace the greeting (“Happy Day 2 of 4…”) and weather snippet with dynamic content or generalized copy—nothing should imply we have data sources we don’t actually integrate yet.
- Remove the “Today’s check-in” and “Hot tub crew” blocks until we can feed schedules from ops systems; otherwise they risk being incorrect.

### Payment Failure / Retry Request
- Remove the “Other ways to pay” list (Apple Pay, wire transfer) unless Stripe’s hosted flow exposes those options for the guest.

### Post-Stay Thank You
- Remove the “Highlights we loved hearing about” and “Stay keepsakes” sections.
- Rework “Reasons to come back soon” so it focuses on property/experience value rather than add-on upsells.
Private chef deposit

Kitchen already sourced ingredients
