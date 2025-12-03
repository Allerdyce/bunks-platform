import * as React from 'react';
import { HostCheckoutConfirmedEmail, type HostCheckoutConfirmedEmailProps } from '@/emails/HostCheckoutConfirmedEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_CHECKOUT_CONFIRMED' as const;

export type SendHostCheckoutConfirmedOptions = HostCheckoutConfirmedEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendHostCheckoutConfirmedOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostCheckoutConfirmed requires propertyName.');
  }
  if (!options.checkoutTime) {
    throw new Error('sendHostCheckoutConfirmed requires checkoutTime.');
  }
}

export async function sendHostCheckoutConfirmed(options: SendHostCheckoutConfirmedOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <HostCheckoutConfirmedEmail
      hostName={options.hostName}
      propertyName={options.propertyName}
      checkoutTime={options.checkoutTime}
      confirmationSource={options.confirmationSource}
      cleanerStatus={options.cleanerStatus}
      lockStatus={options.lockStatus}
      nextArrival={options.nextArrival}
      metrics={options.metrics}
      inspection={options.inspection}
      tasks={options.tasks}
      attachments={options.attachments}
      notes={options.notes}
    />,
  );

  const to = options.to ?? 'hosts@bunks.com';
  const subject = options.subjectOverride ?? `[Checkout confirmed] ${options.propertyName}`;

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
