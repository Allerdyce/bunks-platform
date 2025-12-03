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

const EMAIL_TYPE = 'CANCELLATION_CONFIRMATION' as const;

function defaultPolicyHighlights(propertyName: string): CancellationPolicyHighlight[] {
  return [
    {
      title: 'Flexible window',
      detail: 'Full refund minus service fees when cancelling at least 30 days prior to arrival.',
    },
    {
      title: 'Inside 30 days',
      detail: 'Service fees and partner costs may be retained to cover prep already underway.',
    },
    {
      title: `${propertyName} rebooking credit`,
      detail: 'We drop loyalty credit to your account when you reschedule the same property within 6 months.',
    },
  ];
}

function defaultRebookingOffer(propertyName: string): CancellationRebookingOffer {
  return {
    headline: 'Ready when you are',
    description: `Use your loyalty credit toward a future stay at ${propertyName} or any other Bunks home.`,
    ctaLabel: 'Browse new dates',
    ctaUrl: 'https://bunks.com/properties',
    note: 'Credit automatically appears at checkout when signed into your Bunks account.',
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

  const policyHighlights = options.policyHighlights ?? defaultPolicyHighlights(booking.property.name);
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
