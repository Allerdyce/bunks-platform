import * as React from 'react';
import { HostAddOnSoldEmail, type HostAddOnSoldEmailProps } from '@/emails/HostAddOnSoldEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';
import { isFeatureEnabled } from '@/lib/featureFlags';

const EMAIL_TYPE = 'HOST_ADDON_SOLD' as const;

export type SendHostAddOnSoldOptions = HostAddOnSoldEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
  force?: boolean;
};

function ensurePayload(options: SendHostAddOnSoldOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostAddOnSold requires propertyName.');
  }
  if (!options.addOnName) {
    throw new Error('sendHostAddOnSold requires addOnName.');
  }
  if (!options.guestName) {
    throw new Error('sendHostAddOnSold requires guestName.');
  }
}

export async function sendHostAddOnSold(options: SendHostAddOnSoldOptions) {
  if (!options?.force) {
    const addonsEnabled = await isFeatureEnabled('addons');
    if (!addonsEnabled) {
      console.info('sendHostAddOnSold skipped — add-on marketplace feature flag disabled.');
      return null;
    }
  }

  ensurePayload(options);

  const html = await renderEmail(
    <HostAddOnSoldEmail
      hostName={options.hostName}
      propertyName={options.propertyName}
      guestName={options.guestName}
      stayDates={options.stayDates}
      addOnName={options.addOnName}
      addOnWindow={options.addOnWindow}
      providerName={options.providerName}
      providerContact={options.providerContact}
      guestPrice={options.guestPrice}
      hostShare={options.hostShare}
      bunksFee={options.bunksFee}
      payoutDate={options.payoutDate}
      tasks={options.tasks}
      supplies={options.supplies}
      notes={options.notes}
      contacts={options.contacts}
      attachments={options.attachments}
    />,
  );

  const to = options.to ?? 'hosts@bunks.com';
  const subject =
    options.subjectOverride ?? `${options.addOnName} sold for ${options.propertyName}`;

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
