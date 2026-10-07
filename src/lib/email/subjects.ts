// Subjects as the senders write them (send*.tsx, paymentLinks.ts), with {{tokens}} filled from the
// sample props for Admin → Emails. Keep in step when a sender's subject changes.
export const EMAIL_SUBJECTS: Record<string, string> = {
  // Guest
  'booking-confirmation': "You're booked · {{propertyName}} · {{stayDates}}",
  'payment-link': 'Your private booking for {{propertyName}}',
  'door-code-delivery': 'Arrival details · {{propertyName}} · Sun, February 14',
  'checkout-reminder': 'Checkout {{checkoutDay}} · {{propertyName}}',
  'guest-refund-issued': 'Refund of {{refundAmount}} · {{propertyName}} · {{bookingReference}}',
  'cancellation-confirmation': 'Booking cancelled · {{propertyName}} · {{bookingReference}}',

  // Host
  'host-new-booking': 'New booking · {{propertyName}} · {{stayDates}}',
  'host-guest-cancelled': 'Booking cancelled · {{propertyName}} · {{stayDates}}',
  'host-refund-adjustment': 'Refund of {{refundAmount}} · {{propertyName}} · {{bookingReference}}',
};

export function getEmailSubject(slug: string): string | undefined {
  return EMAIL_SUBJECTS[slug];
}
