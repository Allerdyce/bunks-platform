export const EMAIL_SUBJECTS: Record<string, string> = {
  // Guest — Booking Flow
  'booking-confirmation': 'Your stay is confirmed · {{propertyName}}',
  receipt: 'Receipt for your Bunks stay',
  'booking-details-welcome': 'Welcome to {{propertyName}}',

  // Guest — Stay Preparation
  'pre-stay-48h': '48-hour reminder · {{propertyName}}',
  'pre-stay-24h': '24-hour reminder · Final prep for {{propertyName}}',
  'door-code-delivery': 'Your door code for {{propertyName}}',
  'add-on-confirmation': 'Add-on confirmed for your upcoming stay',

  // Guest — During Stay
  'mid-stay-check-in': 'Quick check-in · How is {{propertyName}}?',
  'issue-report-confirmation': 'We received your report for {{propertyName}}',
  'noise-warning': 'Courtesy reminder · Please keep noise down',

  // Guest — Departure & Post-Stay
  'checkout-reminder': 'Checkout tomorrow · {{propertyName}}',
  'post-stay-thank-you': 'Thank you for staying with Bunks',
  'review-request': 'How was your stay at {{propertyName}}? Leave a review',
  'guest-refund-issued': 'Refund issued for your Bunks stay',

  // Guest — Edge Cases
  'cancellation-confirmation': 'Your booking is cancelled · Next steps',
  'booking-modification-confirmation': 'Booking updated · Please review the changes',
  'no-show-notification': 'No-show notification · Please contact support',
  'payment-failure': 'Action needed · Complete payment for your stay',
  'deposit-release': 'Security deposit released · Thank you',

  // Host — Booking Notifications
  'host-new-booking': 'New booking at {{propertyName}}',
  'host-add-on-sold': 'Add-on sold to your guest',
  'host-booking-modified': 'Booking modified · Please review',

  // Host — Pre-Stay Prep
  'host-prep-3-day': '[Host Prep] {{propertyName}} arrivals in 3 days',
  'host-prep-same-day': '[Host Prep] {{propertyName}} arrivals today',
  'host-door-code-reminder': '[Lock Codes] Refresh for {{propertyName}}',

  // Host — During Stay
  'host-damage-report': '[Incident] {{propertyName}} damage report',
  'host-cleaner-report': 'Cleaner maintenance report · {{propertyName}}',
  'host-noise-alert': 'Noise alert · Please reach out to guests',

  // Host — After Stay
  'host-checkout-confirmed': 'Checkout confirmed · {{propertyName}} is vacant',
  'host-cleaner-assigned': 'Cleaner assignment update',

  // Host — Edge Cases
  'host-guest-cancelled': 'Guest cancelled · Adjust your calendar',
  'host-no-show': 'No-show flagged · {{propertyName}}',
  'host-refund-adjustment': 'Refund adjustment notice',
  'host-chargeback': 'Chargeback / dispute alert',

  // Host — Onboarding
  'host-onboarding-welcome': 'Welcome to Bunks · Let’s get your property live',
  'host-verification-progress': 'Verification progress update',
  'host-listing-ready': 'Your listing draft is ready to review',

  // System & Internal
  'system-email-failed': '[System] Email delivery failed',
  'system-stripe-webhook-failed': '[System] Stripe webhook failed',
  'system-booking-creation-failed': '[System] Booking creation failed',
  'system-cron-summary': '[System] Cron summary digest',
  'system-major-issue': '[System] Major issue reported',
  'system-calendar-sync-error': '[System] Calendar sync error',
  'system-payment-exception': '[System] Payment exception detected',
};

export function getEmailSubject(slug: string): string | undefined {
  return EMAIL_SUBJECTS[slug];
}
