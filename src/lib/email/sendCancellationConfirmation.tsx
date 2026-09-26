import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { CancellationConfirmationEmail } from '@/emails/CancellationConfirmationEmail';
import type {
  CancellationConfirmationEmailProps,
  CancellationPolicyHighlight,
  CancellationRefundLineItem,
  CancellationRebookingOffer,
} from '@/emails/CancellationConfirmationEmail';
import {
  formatStayDates,
  logEmailSend,
  renderEmail,
  resolveBookingReference,
  resolveHostSupportEmail,
  sendEmail,
} from '@/lib/email';
import { CANCELLATION_POLICY } from '@/data/policies';

const EMAIL_TYPE = 'CANCELLATION_CONFIRMATION' as const;

function defaultPolicyHighlights(): CancellationPolicyHighlight[] {
  return [{ title: 'Cancellation policy', detail: CANCELLATION_POLICY.summary }];
}

function defaultRebookingOffer(propertyName: string): CancellationRebookingOffer {
  return {
    headline: 'Ready when you are',
    description: `When you're ready to plan another trip to ${propertyName} or any Bunks home, book direct and save 10%.`,
    ctaLabel: 'Browse dates',
    ctaUrl: 'https://bunks.com',
  };
}

type CancellationConfirmationOptions = {
  cancellationInitiator: string;
  refundTotal: string;
  refundMethod: string;
  refundTimeline: string;
  refundLineItems: CancellationRefundLineItem[];
  cancelledAt?: string;
  cancellationReason?: string;
  statementDescriptor?: string;
  policyHighlights?: CancellationPolicyHighlight[];
  rebookingOffer?: CancellationRebookingOffer | null;
  extraNotes?: string[];
  stayDatesOverride?: string;
  supportOverrides?: Partial<CancellationConfirmationEmailProps['support']>;
  toOverride?: string;
  subjectOverride?: string;
  replyToOverride?: string;
};

function ensurePayload(options: CancellationConfirmationOptions) {
  if (!options.cancellationInitiator) {
    throw new Error('sendCancellationConfirmation requires cancellationInitiator.');
  }
  if (!options.refundTotal) {
    throw new Error('sendCancellationConfirmation requires refundTotal.');
  }
  if (!options.refundMethod) {
    throw new Error('sendCancellationConfirmation requires refundMethod.');
  }
  if (!options.refundTimeline) {
    throw new Error('sendCancellationConfirmation requires refundTimeline.');
  }
  if (!options.refundLineItems || options.refundLineItems.length === 0) {
    throw new Error('sendCancellationConfirmation requires at least one refund line item.');
  }
}

export async function sendCancellationConfirmation(
  bookingId: number,
  options: CancellationConfirmationOptions,
) {
  ensurePayload(options);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const bookingReference = resolveBookingReference(booking);

  const stayDates =
    options.stayDatesOverride ??
    formatStayDates(new Date(booking.checkInDate), new Date(booking.checkOutDate));

  const support = {
    email: options.supportOverrides?.email ?? resolveHostSupportEmail(booking),
    phone: options.supportOverrides?.phone,
    concierge: options.supportOverrides?.concierge,
    note: options.supportOverrides?.note,
  } satisfies CancellationConfirmationEmailProps['support'];

  const policyHighlights = options.policyHighlights ?? defaultPolicyHighlights();
  const rebookingOffer = options.rebookingOffer === null ? undefined : options.rebookingOffer ?? defaultRebookingOffer(booking.property.name);

  const html = await renderEmail(
    <CancellationConfirmationEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      stayDates={stayDates}
      bookingId={bookingReference}
      cancelledAt={options.cancelledAt ?? 'Just now'}
      cancellationInitiator={options.cancellationInitiator}
      cancellationReason={options.cancellationReason}
      refundTotal={options.refundTotal}
      refundMethod={options.refundMethod}
      refundTimeline={options.refundTimeline}
      statementDescriptor={options.statementDescriptor}
      refundLineItems={options.refundLineItems}
      policyHighlights={policyHighlights}
      rebookingOffer={rebookingOffer ?? undefined}
      extraNotes={options.extraNotes}
      support={support}
    />,
  );

  const to = options.toOverride ?? booking.guestEmail;
  const subject = options.subjectOverride ?? `Cancellation confirmed · Booking ${bookingReference}`;
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
