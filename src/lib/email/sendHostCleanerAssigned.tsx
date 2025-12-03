import * as React from 'react';
import { HostCleanerAssignedEmail, type HostCleanerAssignedEmailProps } from '@/emails/HostCleanerAssignedEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_CLEANER_ASSIGNED' as const;

export type SendHostCleanerAssignedOptions = HostCleanerAssignedEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendHostCleanerAssignedOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostCleanerAssigned requires propertyName.');
  }
  if (!options.assignments?.length) {
    throw new Error('sendHostCleanerAssigned requires at least one assignment.');
  }
}

export async function sendHostCleanerAssigned(options: SendHostCleanerAssignedOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <HostCleanerAssignedEmail
      hostName={options.hostName}
      propertyName={options.propertyName}
      turnoverDate={options.turnoverDate}
      guestDeparture={options.guestDeparture}
      assignments={options.assignments}
      prepItems={options.prepItems}
      escalationNote={options.escalationNote}
      attachments={options.attachments}
    />,
  );

  const to = options.to ?? 'hosts@bunks.com';
  const subject = options.subjectOverride ?? `[Cleaners booked] ${options.propertyName}`;

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
