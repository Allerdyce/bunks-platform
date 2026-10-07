export type EmailAudience = 'guest' | 'host';

export interface EmailTemplateSpec {
  slug: string;
  name: string;
  audience: EmailAudience;
  category: string;
  trigger: string;
  description: string;
}

export const EMAIL_TEMPLATES: EmailTemplateSpec[] = [
  // Guest: the three emails every stay gets, then the ones for payment links, refunds and cancellations.
  {
    slug: 'booking-confirmation',
    name: 'Booking Confirmation (with receipt)',
    audience: 'guest',
    category: 'Booking Flow',
    trigger: 'Stripe payment succeeded (checkout or payment link)',
    description: 'The one email at booking: stay dates and times, itemised receipt, trip page and house guide links, cancellation policy.',
  },
  {
    slug: 'door-code-delivery',
    name: 'Arrival Details (door code)',
    audience: 'guest',
    category: 'Stay Preparation',
    trigger: 'Cron: the day before check-in (or at payment for a last-minute stay)',
    description: 'Door code when the home has one, address and map link, check-in/out times, other codes, parking and Wi-Fi.',
  },
  {
    slug: 'checkout-reminder',
    name: 'Checkout Reminder',
    audience: 'guest',
    category: 'Departure & Post-Stay',
    trigger: 'Cron: evening before checkout',
    description: 'Checkout time and a short before-you-leave checklist.',
  },
  {
    slug: 'payment-link',
    name: 'Private Payment Link',
    audience: 'guest',
    category: 'Booking Flow',
    trigger: 'Admin sends a private booking (Admin → Bookings → New private booking)',
    description: 'Custom price breakdown, the pay link and when the hold expires.',
  },
  {
    slug: 'guest-refund-issued',
    name: 'Guest Refund Issued',
    audience: 'guest',
    category: 'Departure & Post-Stay',
    trigger: 'Partial refund processed',
    description: 'Explains refund amount, method, and expected timeline.',
  },
  {
    slug: 'cancellation-confirmation',
    name: 'Cancellation Confirmation',
    audience: 'guest',
    category: 'Edge Cases',
    trigger: 'Booking cancellation event',
    description: 'Summarizes refund policy, retained fees, and rebooking links.',
  },

  // Host
  {
    slug: 'host-new-booking',
    name: 'New Booking Alert',
    audience: 'host',
    category: 'Booking Notifications',
    trigger: 'Booking marked paid',
    description: 'Guest details, stay dates, payout estimate, and special requests.',
  },
  {
    slug: 'host-guest-cancelled',
    name: 'Guest Cancelled Booking',
    audience: 'host',
    category: 'Edge Cases',
    trigger: 'Guest cancellation',
    description: 'Explains payout changes and calendar state.',
  },
  {
    slug: 'host-refund-adjustment',
    name: 'Refund Adjustment Notice',
    audience: 'host',
    category: 'Edge Cases',
    trigger: 'Refund issued to guest',
    description: 'Notifies host of payout impact.',
  },
];
