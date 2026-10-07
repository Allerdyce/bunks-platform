export const SUPPORTED_SAMPLE_TEMPLATE_SLUGS = [
  'booking-confirmation',
  'payment-link',
  'door-code-delivery',
  'checkout-reminder',
  'guest-refund-issued',
  'cancellation-confirmation',
  'host-new-booking',
  'host-guest-cancelled',
  'host-refund-adjustment',
] as const;

export type SampleTemplateSlug = (typeof SUPPORTED_SAMPLE_TEMPLATE_SLUGS)[number];

export function isSampleTemplateSlug(slug: string): slug is SampleTemplateSlug {
  return (SUPPORTED_SAMPLE_TEMPLATE_SLUGS as readonly string[]).includes(slug);
}
