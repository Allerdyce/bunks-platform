import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { GuestRefundIssuedEmail } from '@/emails/GuestRefundIssuedEmail';
import type {
  GuestRefundIssuedEmailProps,
  RefundLineItem,
  RefundTimelineItem,
} from '@/emails/GuestRefundIssuedEmail';
import { logEmailSend, renderEmail, resolveHostSupportEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'GUEST_REFUND_ISSUED' as const;

type GuestRefundIssuedOptions = {
  refundTotal: string;
  paymentMethod: string;
  refundReason: string;
  lineItems: RefundLineItem[];
  expectedArrivalWindow: string;
  initiatedAt?: string;
  currencyNote?: string;
  statementDescriptor?: string;
  timeline?: RefundTimelineItem[];
  extraNotes?: string[];
  policyUrl?: string;
  supportOverrides?: Partial<GuestRefundIssuedEmailProps['support']>;
  toOverride?: string;
  subjectOverride?: string;
  replyToOverride?: string;
};

function ensurePayload(options: GuestRefundIssuedOptions) {
  if (!options.refundTotal) {
    throw new Error('sendGuestRefundIssued requires refundTotal.');
  }
  if (!options.paymentMethod) {
    throw new Error('sendGuestRefundIssued requires paymentMethod.');
  }
  if (!options.refundReason) {
    throw new Error('sendGuestRefundIssued requires refundReason.');
  }
  if (!options.expectedArrivalWindow) {
    throw new Error('sendGuestRefundIssued requires expectedArrivalWindow.');
  }
  if (!options.lineItems || options.lineItems.length === 0) {
    throw new Error('sendGuestRefundIssued requires at least one line item.');
  }
}

export async function sendGuestRefundIssued(bookingId: number, options: GuestRefundIssuedOptions) {
  ensurePayload(options);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const bookingReference = booking.publicReference ?? `B-${booking.id}`;

  const support = {
    email: options.supportOverrides?.email ?? resolveHostSupportEmail(booking),
    phone: options.supportOverrides?.phone,
    concierge: options.supportOverrides?.concierge,
    note: options.supportOverrides?.note,
  } satisfies GuestRefundIssuedEmailProps['support'];

  const html = await renderEmail(
    <GuestRefundIssuedEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      bookingId={bookingReference}
      refundTotal={options.refundTotal}
      currencyNote={options.currencyNote}
      paymentMethod={options.paymentMethod}
      statementDescriptor={options.statementDescriptor}
      refundReason={options.refundReason}
      initiatedAt={options.initiatedAt ?? 'Just now'}
      expectedArrivalWindow={options.expectedArrivalWindow}
      lineItems={options.lineItems}
      timeline={options.timeline}
      support={support}
      extraNotes={options.extraNotes}
      policyUrl={options.policyUrl}
    />,
  );

  const to = options.toOverride ?? booking.guestEmail;
  const subject = options.subjectOverride ?? `Refund processed · Booking ${bookingReference}`;
  const replyTo = options.replyToOverride ?? support.email;

  const logResult = async (status: 'SENT' | 'FAILED', error?: unknown) => {
    await logEmailSend({
      bookingId: booking.id,
      to,
      type: EMAIL_TYPE,
      status,
      error: error ? String((error as Error)?.message ?? error) : undefined,
    });
  };

  try {
    const response = await sendEmail({
      to,
      subject,
      html,
      replyTo,
    });
    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
