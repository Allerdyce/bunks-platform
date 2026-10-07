// Guests get three emails per stay (owner, 6 Oct 2026): the booking confirmation (with the
// receipt), arrival details the day before check-in, and the checkout reminder.
// EMAIL_PAUSE_ALL=true holds every email; the admin Emails page then shows them as paused.
export type EmailDeliveryState = 'sending' | 'paused';

export function templateDeliveryState(): EmailDeliveryState {
  return process.env.EMAIL_PAUSE_ALL === 'true' ? 'paused' : 'sending';
}
