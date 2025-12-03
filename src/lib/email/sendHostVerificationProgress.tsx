import * as React from 'react';
import { HostVerificationProgressEmail, type HostVerificationProgressEmailProps } from '@/emails/HostVerificationProgressEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_VERIFICATION_PROGRESS' as const;

export type SendHostVerificationProgressOptions = HostVerificationProgressEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
};

function ensurePayload(options: SendHostVerificationProgressOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostVerificationProgress requires propertyName.');
  }
  if (!options.expectedGoLive) {
    throw new Error('sendHostVerificationProgress requires expectedGoLive.');
  }
  if (!options.tracks || options.tracks.length === 0) {
    throw new Error('sendHostVerificationProgress requires at least one track item.');
  }
}

export async function sendHostVerificationProgress(options: SendHostVerificationProgressOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <HostVerificationProgressEmail
      hostName={options.hostName}
      propertyName={options.propertyName}
      expectedGoLive={options.expectedGoLive}
      tracks={options.tracks}
      outstanding={options.outstanding}
      approvedItems={options.approvedItems}
      notes={options.notes}
    />,
  );

  const to = options.to ?? 'hosts@bunks.com';
  const subject = options.subjectOverride ?? `Verification update · ${options.propertyName}`;

  const logResult = async (status: 'SENT' | 'FAILED', error?: unknown) => {
    await logEmailSend({
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
