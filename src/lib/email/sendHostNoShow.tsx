import * as React from 'react';
import { HostNoShowEmail, type HostNoShowEmailProps } from '@/emails/HostNoShowEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_NO_SHOW' as const;

export type SendHostNoShowOptions = HostNoShowEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendHostNoShowOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostNoShow requires propertyName.');
  }
  if (!options.guestName) {
    throw new Error('sendHostNoShow requires guestName.');
  }
}

export async function sendHostNoShow(options: SendHostNoShowOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <HostNoShowEmail
      hostName={options.hostName}
      propertyName={options.propertyName}
      guestName={options.guestName}
      stayDates={options.stayDates}
      declaredAt={options.declaredAt}
      detectionSource={options.detectionSource}
      retainedAmount={options.retainedAmount}
      retentionLines={options.retentionLines}
      calendarStatus={options.calendarStatus}
      rebookWindow={options.rebookWindow}
      tasks={options.tasks}
      notes={options.notes}
    />,
  );

  const to = options.to ?? 'hosts@bunks.com';
  const subject = options.subjectOverride ?? `[No-show] ${options.propertyName}`;

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
