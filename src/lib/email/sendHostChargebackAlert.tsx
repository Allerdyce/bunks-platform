import * as React from 'react';
import { HostChargebackEmail, type HostChargebackEmailProps } from '@/emails/HostChargebackEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_CHARGEBACK' as const;

export type SendHostChargebackAlertOptions = HostChargebackEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendHostChargebackAlertOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostChargebackAlert requires propertyName.');
  }
  if (!options.disputeId) {
    throw new Error('sendHostChargebackAlert requires disputeId.');
  }
}

export async function sendHostChargebackAlert(options: SendHostChargebackAlertOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <HostChargebackEmail
      hostName={options.hostName}
      propertyName={options.propertyName}
      guestName={options.guestName}
      disputeId={options.disputeId}
      amount={options.amount}
      replyBy={options.replyBy}
      processor={options.processor}
      reason={options.reason}
      narrative={options.narrative}
      evidenceNeeded={options.evidenceNeeded}
      timeline={options.timeline}
      links={options.links}
      supportNote={options.supportNote}
    />,
  );

  const to = options.to ?? 'hosts@bunks.com';
  const subject = options.subjectOverride ?? `[Chargeback] ${options.propertyName} · ${options.amount}`;

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
