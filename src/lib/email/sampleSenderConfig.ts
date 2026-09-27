export const SUPPORTED_SAMPLE_TEMPLATE_SLUGS = [
  'booking-confirmation',
  'receipt',
  'booking-details-welcome',
  'pre-stay-48h',
  'pre-stay-24h',
  'door-code-delivery',
  'mid-stay-check-in',
  'checkout-reminder',
  'review-request',
  'guest-refund-issued',
  'cancellation-confirmation',
  'payment-failure',
  'host-new-booking',
  'host-prep-3-day',
  'host-prep-same-day',
  'host-guest-cancelled',
  'host-refund-adjustment',
] as const;

export type SampleTemplateSlug = (typeof SUPPORTED_SAMPLE_TEMPLATE_SLUGS)[number];

export function isSampleTemplateSlug(slug: string): slug is SampleTemplateSlug {
  return (SUPPORTED_SAMPLE_TEMPLATE_SLUGS as readonly string[]).includes(slug);
}
