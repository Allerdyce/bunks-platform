import { logEmailSend } from './logEmail';
import { sendEmail } from './sendEmail';

type LoggedEmail = {
  bookingId: number;
  type: Parameters<typeof logEmailSend>[0]['type'];
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

/** Sends a booking email and records it (or its failure) in the email log. */
export async function sendLoggedEmail({ bookingId, type, to, subject, html, replyTo }: LoggedEmail) {
  try {
    const response = await sendEmail({ to, subject, html, replyTo });
    await logEmailSend({ bookingId, to, type });
    return response;
  } catch (error) {
    await logEmailSend({
      bookingId,
      to,
      type,
      status: 'FAILED',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
