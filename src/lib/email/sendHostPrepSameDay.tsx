import * as React from 'react';
import { HostPrepSameDayEmail, type HostPrepSameDayEmailProps } from '@/emails/HostPrepSameDayEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_PREP_SAME_DAY' as const;

export type SendHostPrepSameDayOptions = HostPrepSameDayEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendHostPrepSameDayOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostPrepSameDay requires propertyName.');
  }
  if (!options.guestName) {
    throw new Error('sendHostPrepSameDay requires guestName.');
  }
  if (!options.arrivalTasks?.length) {
    throw new Error('sendHostPrepSameDay requires at least one arrival task.');
  }
  if (!options.checklist?.length) {
    throw new Error('sendHostPrepSameDay requires checklist items.');
  }
}

export async function sendHostPrepSameDay(options: SendHostPrepSameDayOptions) {
  ensurePayload(options);

  const { to, cc, replyTo, subjectOverride, bookingId, ...emailProps } = options;
  const html = await renderEmail(<HostPrepSameDayEmail {...emailProps} />);

  const recipients = to ?? 'hosts@bunks.com';
  const subject =
    subjectOverride ?? `[Host Prep] ${options.propertyName} · arrivals today (${options.etaLabel ?? options.arrivalWindow})`;

  const logResult = async (status: 'SENT' | 'FAILED', error?: unknown) => {
    await logEmailSend({
      bookingId,
      to: Array.isArray(recipients) ? recipients.join(',') : recipients,
      type: EMAIL_TYPE,
      status,
      error: error ? String((error as Error)?.message ?? error) : undefined,
    });
  };

  try {
    const response = await sendEmail({
      to: recipients,
      cc,
      replyTo,
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
