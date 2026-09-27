import type { EmailType } from '@prisma/client';

// Emails paused for launch. The daily automations job skips these types, and the
// admin Emails page shows them as paused. Remove an entry to turn it back on.
export const PAUSED_EMAIL_TYPES = new Set<EmailType>([
  'HOST_PREP_THREE_DAY',
  'HOST_PREP_SAME_DAY',
  'MID_STAY_CONCIERGE',
]);

// Catalog slugs for the paused types (admin Emails page).
export const PAUSED_TEMPLATE_SLUGS = new Set<string>([
  'host-prep-3-day',
  'host-prep-same-day',
  'mid-stay-check-in',
]);

export type EmailDeliveryState = 'sending' | 'paused';

export function templateDeliveryState(slug: string): EmailDeliveryState {
  if (process.env.EMAIL_PAUSE_ALL === 'true') return 'paused';
  return PAUSED_TEMPLATE_SLUGS.has(slug) ? 'paused' : 'sending';
}
