import * as React from 'react';
import { HostBookingModifiedEmail, type HostBookingModifiedEmailProps } from '@/emails/HostBookingModifiedEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_BOOKING_MODIFIED' as const;

export type SendHostBookingModifiedOptions = HostBookingModifiedEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingLogId?: number;
};

function ensurePayload(options: SendHostBookingModifiedOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostBookingModified requires propertyName.');
  }
}

export async function sendHostBookingModified(options: SendHostBookingModifiedOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <HostBookingModifiedEmail
      hostName={options.hostName}
      propertyName={options.propertyName}
      guestName={options.guestName}
      bookingId={options.bookingId}
      changeLoggedAt={options.changeLoggedAt}
      summary={options.summary}
      stayDatesBefore={options.stayDatesBefore}
      stayDatesAfter={options.stayDatesAfter}
      calendarStatus={options.calendarStatus}
      payoutImpact={options.payoutImpact}
      changeItems={options.changeItems}
      tasks={options.tasks}
      followUpNotes={options.followUpNotes}
    />,
  );

  const to = options.to ?? 'hosts@bunks.com';
  const subject = options.subjectOverride ?? `[Booking update] ${options.propertyName}`;

  const logResult = async (status: 'SENT' | 'FAILED', error?: unknown) => {
    await logEmailSend({
      bookingId: options.bookingLogId,
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
