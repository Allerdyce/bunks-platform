export const EMAIL_SUBJECTS: Record<string, string> = {
  // Guest — Booking Flow
  'booking-confirmation': 'Your stay is confirmed · {{propertyName}}',
  receipt: 'Receipt for your Bunks stay',
  'booking-details-welcome': 'Welcome to {{propertyName}}',

  // Guest — Stay Preparation
  'pre-stay-48h': '48-hour reminder · {{propertyName}}',
  'pre-stay-24h': '24-hour reminder · Final prep for {{propertyName}}',
  'door-code-delivery': 'Your door code for {{propertyName}}',

  // Guest — During Stay
  'mid-stay-check-in': 'Quick check-in · How is {{propertyName}}?',

  // Guest — Departure & Post-Stay
  'checkout-reminder': 'Checkout tomorrow · {{propertyName}}',
  'review-request': 'How was your stay at {{propertyName}}? Leave a review',
  'guest-refund-issued': 'Refund issued for your Bunks stay',

  // Guest — Edge Cases
  'cancellation-confirmation': 'Your booking is cancelled · Next steps',
  'payment-failure': 'Action needed · Complete payment for your stay',

  // Host — Booking Notifications
  'host-new-booking': 'New booking at {{propertyName}}',

  // Host — Pre-Stay Prep
  'host-prep-3-day': '[Host Prep] {{propertyName}} arrivals in 3 days',
  'host-prep-same-day': '[Host Prep] {{propertyName}} arrivals today',

  // Host — Edge Cases
  'host-guest-cancelled': 'Guest cancelled · Adjust your calendar',
  'host-refund-adjustment': 'Refund adjustment notice',
};

export function getEmailSubject(slug: string): string | undefined {
  return EMAIL_SUBJECTS[slug];
}
