import * as React from 'react';
import { HostListingReadyEmail, type HostListingReadyEmailProps } from '@/emails/HostListingReadyEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_LISTING_READY' as const;

export type SendHostListingReadyOptions = HostListingReadyEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
};

function ensurePayload(options: SendHostListingReadyOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostListingReady requires propertyName.');
  }
  if (!options.previewUrl) {
    throw new Error('sendHostListingReady requires previewUrl.');
  }
  if (!options.summary) {
    throw new Error('sendHostListingReady requires summary.');
  }
}

export async function sendHostListingReady(options: SendHostListingReadyOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <HostListingReadyEmail
      hostName={options.hostName}
      propertyName={options.propertyName}
      previewUrl={options.previewUrl}
      summary={options.summary}
      highlights={options.highlights}
      actions={options.actions}
      photoStats={options.photoStats}
      goLiveEta={options.goLiveEta}
    />,
  );

  const to = options.to ?? 'hosts@bunks.com';
  const subject = options.subjectOverride ?? `Listing draft ready · ${options.propertyName}`;

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
