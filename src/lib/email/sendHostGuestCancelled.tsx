import * as React from 'react';
import { HostGuestCancelledEmail, type HostGuestCancelledEmailProps } from '@/emails/HostGuestCancelledEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_GUEST_CANCELLED' as const;

export type SendHostGuestCancelledOptions = HostGuestCancelledEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendHostGuestCancelledOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostGuestCancelled requires propertyName.');
  }
  if (!options.guestName) {
    throw new Error('sendHostGuestCancelled requires guestName.');
  }
}

export async function sendHostGuestCancelled(options: SendHostGuestCancelledOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <HostGuestCancelledEmail
      hostName={options.hostName}
      propertyName={options.propertyName}
      guestName={options.guestName}
      cancelledAt={options.cancelledAt}
      stayDates={options.stayDates}
      policyApplied={options.policyApplied}
      refundSummary={options.refundSummary}
      lineItems={options.lineItems}
      calendarActions={options.calendarActions}
      rebookNote={options.rebookNote}
      nextArrival={options.nextArrival}
      attachments={options.attachments}
    />,
  );

  const to = options.to ?? 'hosts@bunks.com';
  const subject = options.subjectOverride ?? `[Cancellation] ${options.propertyName}`;

  const logResult = async (status: 'SENT' | 'FAILED', error?: unknown) => {
    await logEmailSend({
      bookingId: options.bookingId,
      to: Array.isArray(to) ? to.join(',') : to,
      type: EMAIL_TYPE,
      status,
      error: error ? String((error as Error)?.message ?? error) : undefined,
    });
  };

  try {
    const response = await sendEmail({
      to,
      cc: options.cc,
      replyTo: options.replyTo,
      subject,
      html,
    });
    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
