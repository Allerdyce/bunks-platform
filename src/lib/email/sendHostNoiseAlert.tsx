import * as React from 'react';
import { HostNoiseAlertEmail, type HostNoiseAlertEmailProps } from '@/emails/HostNoiseAlertEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_NOISE_ALERT' as const;

export type SendHostNoiseAlertOptions = HostNoiseAlertEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendHostNoiseAlertOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostNoiseAlert requires propertyName.');
  }
  if (!options.alertSource) {
    throw new Error('sendHostNoiseAlert requires alertSource.');
  }
}

export async function sendHostNoiseAlert(options: SendHostNoiseAlertOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <HostNoiseAlertEmail
      hostName={options.hostName}
      propertyName={options.propertyName}
      alertSource={options.alertSource}
      detectedAt={options.detectedAt}
      quietHours={options.quietHours}
      decibelPeak={options.decibelPeak}
      threshold={options.threshold}
      location={options.location}
      currentStatus={options.currentStatus}
      guestThreadUrl={options.guestThreadUrl}
      actions={options.actions}
      timeline={options.timeline}
      contacts={options.contacts}
      notes={options.notes}
    />,
  );

  const to = options.to ?? 'hosts@bunks.com';
  const subject = options.subjectOverride ?? `[Noise alert] ${options.propertyName}`;

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
