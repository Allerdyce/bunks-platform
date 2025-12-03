import * as React from 'react';
import { HostDoorCodeReminderEmail, type HostDoorCodeReminderEmailProps } from '@/emails/HostDoorCodeReminderEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_DOOR_CODE_REMINDER' as const;

type SendHostDoorCodeReminderOptions = HostDoorCodeReminderEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendHostDoorCodeReminderOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostDoorCodeReminder requires propertyName.');
  }
  if (!options.guestName) {
    throw new Error('sendHostDoorCodeReminder requires guestName.');
  }
  if (!options.codes?.length) {
    throw new Error('sendHostDoorCodeReminder requires at least one lock code.');
  }
}

export async function sendHostDoorCodeReminder(options: SendHostDoorCodeReminderOptions) {
  ensurePayload(options);

  const { to, cc, replyTo, subjectOverride, bookingId, ...emailProps } = options;
  const html = await renderEmail(<HostDoorCodeReminderEmail {...emailProps} />);

  const recipients = to ?? 'hosts@bunks.com';
  const subject = subjectOverride ?? `[Lock Codes] ${options.propertyName} · refresh for ${options.guestName}`;

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
