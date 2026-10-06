export type EmailAudience = 'guest' | 'host';
export type EmailStatus = 'shipped' | 'in-progress' | 'planned' | 'parked';

export interface EmailTemplateSpec {
  slug: string;
  name: string;
  audience: EmailAudience;
  category: string;
  trigger: string;
  description: string;
  status: EmailStatus;
  templatePath?: string;
  serviceFunction?: string;
}

export const EMAIL_TEMPLATES: EmailTemplateSpec[] = [
  // Guest — Booking Flow
  {
    slug: 'booking-confirmation',
    name: 'Booking Confirmation (with receipt)',
    audience: 'guest',
    category: 'Booking Flow',
    trigger: 'Stripe payment succeeded (checkout or payment link)',
    description: 'The one email at booking: stay dates and times, itemised receipt, trip page and house guide links, cancellation policy.',
    status: 'shipped',
    templatePath: 'src/emails/BookingConfirmationEmail.tsx',
    serviceFunction: 'sendBookingConfirmation',
  },
  {
    slug: 'receipt',
    name: 'Receipt / Payment Confirmation',
    audience: 'guest',
    category: 'Booking Flow',
    trigger: 'Stripe webhook or manual resend',
    description: 'Retired: the itemised receipt is now part of the booking confirmation.',
    status: 'shipped',
    templatePath: 'src/emails/ReceiptEmail.tsx',
    serviceFunction: 'sendReceiptEmail',
  },
  {
    slug: 'booking-details-welcome',
    name: 'Booking Details / Welcome Email',
    audience: 'guest',
    category: 'Booking Flow',
    trigger: 'Immediately after booking confirmed',
    description: 'Retired: folded into the booking confirmation and arrival details.',
    status: 'shipped',
    templatePath: 'src/emails/BookingWelcomeEmail.tsx',
    serviceFunction: 'sendBookingWelcomeEmail',
  },

  // Guest — Stay Preparation
  {
    slug: 'pre-stay-48h',
    name: '48-Hour Pre-Stay Reminder',
    audience: 'guest',
    category: 'Stay Preparation',
    trigger: 'Cron: 48 hours before check-in',
    description: 'Retired: folded into the arrival details email.',
    status: 'shipped',
    templatePath: 'src/emails/PreStayReminderEmail.tsx',
    serviceFunction: 'sendPreStayReminder',
  },
  {
    slug: 'pre-stay-24h',
    name: '24-Hour Pre-Stay Reminder',
    audience: 'guest',
    category: 'Stay Preparation',
    trigger: 'Cron: 24 hours before check-in',
    description: 'Retired: folded into the arrival details email.',
    status: 'shipped',
    templatePath: 'src/emails/PreStay24hEmail.tsx',
    serviceFunction: 'sendPreStay24hReminder',
  },
  {
    slug: 'door-code-delivery',
    name: 'Arrival Details (door code)',
    audience: 'guest',
    category: 'Stay Preparation',
    trigger: 'Cron: the day before check-in (or at payment for a last-minute stay)',
    description: 'Door code when the home has one, address and map link, check-in/out times, other codes, parking and Wi-Fi.',
    status: 'shipped',
    templatePath: 'src/emails/DoorCodeEmail.tsx',
    serviceFunction: 'sendDoorCodeEmail',
  },

  // Guest — During Stay
  {
    slug: 'mid-stay-check-in',
    name: 'Mid-Stay Check-In',
    audience: 'guest',
    category: 'During Stay',
    trigger: 'Cron: morning of day 2',
    description: 'Concierge style check-in with optional upsells and support contact.',
    status: 'shipped',
    templatePath: 'src/emails/MidStayCheckInEmail.tsx',
    serviceFunction: 'sendMidStayCheckIn',
  },

  // Guest — Departure & Post-Stay
  {
    slug: 'checkout-reminder',
    name: 'Checkout Reminder',
    audience: 'guest',
    category: 'Departure & Post-Stay',
    trigger: 'Cron: evening before checkout',
    description: 'Checkout time and a short before-you-leave checklist.',
    status: 'shipped',
    templatePath: 'src/emails/CheckoutReminderEmail.tsx',
    serviceFunction: 'sendCheckoutReminder',
  },
  {
    slug: 'review-request',
    name: 'Review Request',
    audience: 'guest',
    category: 'Departure & Post-Stay',
    trigger: 'Cron: 24 hours after checkout',
    description: 'Not sent: review links are not built yet (sendReviewRequest returns early).',
    status: 'shipped',
    templatePath: 'src/emails/ReviewRequestEmail.tsx',
    serviceFunction: 'sendReviewRequest',
  },
  {
    slug: 'guest-refund-issued',
    name: 'Guest Refund Issued',
    audience: 'guest',
    category: 'Departure & Post-Stay',
    trigger: 'Partial refund processed',
    description: 'Explains refund amount, method, and expected timeline.',
    status: 'shipped',
    templatePath: 'src/emails/GuestRefundIssuedEmail.tsx',
    serviceFunction: 'sendGuestRefundIssued',
  },

  // Guest — Edge Cases
  {
    slug: 'cancellation-confirmation',
    name: 'Cancellation Confirmation',
    audience: 'guest',
    category: 'Edge Cases',
    trigger: 'Booking cancellation event',
    description: 'Summarizes refund policy, retained fees, and rebooking links.',
    status: 'shipped',
    templatePath: 'src/emails/CancellationConfirmationEmail.tsx',
    serviceFunction: 'sendCancellationConfirmation',
  },
  {
    slug: 'payment-failure',
    name: 'Payment Failure / Retry Request',
    audience: 'guest',
    category: 'Edge Cases',
    trigger: 'Stripe payment requires further action',
    description: 'Not sent: the payment form shows card declines, so no email is needed.',
    status: 'shipped',
    templatePath: 'src/emails/PaymentFailureEmail.tsx',
    serviceFunction: 'sendPaymentFailure',
  },

  // Host — Booking Notifications
  {
    slug: 'host-new-booking',
    name: 'New Booking Alert',
    audience: 'host',
    category: 'Booking Notifications',
    trigger: 'Booking marked paid',
    description: 'Guest details, stay dates, payout estimate, and special requests.',
    status: 'shipped',
    templatePath: 'src/emails/HostNotificationEmail.tsx',
    serviceFunction: 'sendHostNotification',
  },

  // Host — Pre-Stay Prep
  {
    slug: 'host-prep-3-day',
    name: '3-Day Pre-Arrival Host Reminder',
    audience: 'host',
    category: 'Pre-Stay Prep',
    trigger: 'Cron: 3 days before arrival',
    description: 'Covers cleaning schedule and special requests.',
    status: 'shipped',
    templatePath: 'src/emails/HostPrepThreeDayEmail.tsx',
    serviceFunction: 'sendHostPrepThreeDay',
  },
  {
    slug: 'host-prep-same-day',
    name: 'Same-Day Arrival Host Reminder',
    audience: 'host',
    category: 'Pre-Stay Prep',
    trigger: 'Morning of check-in',
    description: 'Final ETA, notes, and support contact.',
    status: 'shipped',
    templatePath: 'src/emails/HostPrepSameDayEmail.tsx',
    serviceFunction: 'sendHostPrepSameDay',
  },

  // Host — Edge Cases
  {
    slug: 'host-guest-cancelled',
    name: 'Guest Cancelled Booking',
    audience: 'host',
    category: 'Edge Cases',
    trigger: 'Guest cancellation',
    description: 'Explains payout changes and calendar state.',
    status: 'shipped',
    templatePath: 'src/emails/HostGuestCancelledEmail.tsx',
    serviceFunction: 'sendHostGuestCancelled',
  },
  {
    slug: 'host-refund-adjustment',
    name: 'Refund Adjustment Notice',
    audience: 'host',
    category: 'Edge Cases',
    trigger: 'Refund issued to guest',
    description: 'Notifies host of payout impact.',
    status: 'shipped',
    templatePath: 'src/emails/HostRefundAdjustmentEmail.tsx',
    serviceFunction: 'sendHostRefundAdjustment',
  },
];
