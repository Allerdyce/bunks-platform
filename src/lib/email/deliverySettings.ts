import type { EmailType } from '@prisma/client';

// Emails not sent. The daily automations job skips these types, and the admin Emails page shows
// them as paused. Remove an entry to turn it back on.
// Guests get three emails per stay (owner, 6 Oct 2026): the booking confirmation (with the
// receipt), arrival details the day before check-in, and the checkout reminder. The separate
// receipt, welcome and 48h/24h reminders are folded into those.
export const PAUSED_EMAIL_TYPES = new Set<EmailType>([
  'HOST_PREP_THREE_DAY',
  'HOST_PREP_SAME_DAY',
  'MID_STAY_CONCIERGE',
  'PRE_STAY_REMINDER',
  'PRE_STAY_REMINDER_24H',
]);

// Catalog slugs for templates that aren't sent (admin Emails page).
export const PAUSED_TEMPLATE_SLUGS = new Set<string>([
  'host-prep-3-day',
  'host-prep-same-day',
  'mid-stay-check-in',
  'pre-stay-48h',
  'pre-stay-24h',
  'receipt',
  'booking-details-welcome',
  'review-request',
  'payment-failure',
]);

export type EmailDeliveryState = 'sending' | 'paused';

export function templateDeliveryState(slug: string): EmailDeliveryState {
  if (process.env.EMAIL_PAUSE_ALL === 'true') return 'paused';
  return PAUSED_TEMPLATE_SLUGS.has(slug) ? 'paused' : 'sending';
}
