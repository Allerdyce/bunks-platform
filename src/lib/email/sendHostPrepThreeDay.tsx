import * as React from 'react';
import { HostPrepThreeDayEmail, type HostPrepThreeDayEmailProps } from '@/emails/HostPrepThreeDayEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_PREP_THREE_DAY' as const;

export type SendHostPrepThreeDayOptions = HostPrepThreeDayEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendHostPrepThreeDayOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostPrepThreeDay requires propertyName.');
  }
  if (!options.guestName) {
    throw new Error('sendHostPrepThreeDay requires guestName.');
  }
  if (!options.prepTimeline?.length) {
    throw new Error('sendHostPrepThreeDay requires at least one prep timeline item.');
  }
}

export async function sendHostPrepThreeDay(options: SendHostPrepThreeDayOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <HostPrepThreeDayEmail
      hostName={options.hostName}
      propertyName={options.propertyName}
      propertyLocation={options.propertyLocation}
      guestName={options.guestName}
      stayDates={options.stayDates}
      arrivalWindow={options.arrivalWindow}
      nights={options.nights}
      headcount={options.headcount}
      housekeepingWindow={options.housekeepingWindow}
      specialRequests={options.specialRequests}
      prepTimeline={options.prepTimeline}
      supplyReminders={options.supplyReminders}
      quickFacts={options.quickFacts}
      contacts={options.contacts}
      attachments={options.attachments}
      escalationNote={options.escalationNote}
    />,
  );

  const to = options.to ?? 'hosts@bunks.com';
  const subject = options.subjectOverride ?? `[Host Prep] ${options.propertyName} · arrivals in 3 days`;

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
