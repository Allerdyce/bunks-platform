import * as React from 'react';
import { HostRefundAdjustmentEmail, type HostRefundAdjustmentEmailProps } from '@/emails/HostRefundAdjustmentEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_REFUND_ADJUSTMENT' as const;

export type SendHostRefundAdjustmentOptions = HostRefundAdjustmentEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  logBookingId?: number;
};

function ensurePayload(options: SendHostRefundAdjustmentOptions) {
  if (!options.propertyName) {
    throw new Error('sendHostRefundAdjustment requires propertyName.');
  }
  if (!options.adjustments?.length) {
    throw new Error('sendHostRefundAdjustment requires adjustments.');
  }
}

export async function sendHostRefundAdjustment(options: SendHostRefundAdjustmentOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <HostRefundAdjustmentEmail
      hostName={options.hostName}
      propertyName={options.propertyName}
      guestName={options.guestName}
      bookingId={options.bookingId}
      processedAt={options.processedAt}
      adjustmentReason={options.adjustmentReason}
      payoutBefore={options.payoutBefore}
      payoutAfter={options.payoutAfter}
      guestRefund={options.guestRefund}
      adjustments={options.adjustments}
      timeline={options.timeline}
      documents={options.documents}
      supportNote={options.supportNote}
    />,
  );

  const to = options.to ?? 'hosts@bunks.com';
  const subject = options.subjectOverride ?? `[Refund adjustment] ${options.propertyName}`;

  const logResult = async (status: 'SENT' | 'FAILED', error?: unknown) => {
    await logEmailSend({
      bookingId: options.logBookingId,
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
