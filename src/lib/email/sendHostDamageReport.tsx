import * as React from 'react';
import { HostDamageReportEmail, type HostDamageReportEmailProps } from '@/emails/HostDamageReportEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'DAMAGE_REPORT' as const;

type SendHostDamageReportOptions = HostDamageReportEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendHostDamageReportOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostDamageReport requires propertyName.');
  }
  if (!options.guestName) {
    throw new Error('sendHostDamageReport requires guestName.');
  }
  if (!options.summary) {
    throw new Error('sendHostDamageReport requires summary text.');
  }
}

export async function sendHostDamageReport(options: SendHostDamageReportOptions) {
  ensurePayload(options);

  const { to, cc, replyTo, subjectOverride, bookingId, ...emailProps } = options;
  const html = await renderEmail(<HostDamageReportEmail {...emailProps} />);

  const recipients = to ?? 'hosts@bunks.com';
  const subject =
    subjectOverride ?? `[Incident] ${options.propertyName} · ${options.guestName} (${options.incidentDate ?? 'today'})`;

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
