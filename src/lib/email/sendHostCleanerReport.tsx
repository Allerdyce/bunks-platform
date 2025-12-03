import * as React from 'react';
import { HostCleanerReportEmail, type HostCleanerReportEmailProps } from '@/emails/HostCleanerReportEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_CLEANER_REPORT' as const;

export type SendHostCleanerReportOptions = HostCleanerReportEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendHostCleanerReportOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostCleanerReport requires propertyName.');
  }
  if (!options.issues?.length) {
    throw new Error('sendHostCleanerReport requires at least one issue.');
  }
}

export async function sendHostCleanerReport(options: SendHostCleanerReportOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <HostCleanerReportEmail
      hostName={options.hostName}
      propertyName={options.propertyName}
      cleanerName={options.cleanerName}
      turnoverDate={options.turnoverDate}
      reportLoggedAt={options.reportLoggedAt}
      summary={options.summary}
      arrivalWindow={options.arrivalWindow}
      nextGuest={options.nextGuest}
      issues={options.issues}
      supplyLevels={options.supplyLevels}
      followUps={options.followUps}
      attachments={options.attachments}
    />,
  );

  const to = options.to ?? 'hosts@bunks.com';
  const subject = options.subjectOverride ?? `[Cleaner report] ${options.propertyName}`;

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
