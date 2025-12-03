import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { PaymentFailureEmail } from '@/emails/PaymentFailureEmail';
import type {
  PaymentFailureActionItem,
  PaymentFailureEmailProps,
} from '@/emails/PaymentFailureEmail';
import {
  formatStayDates,
  logEmailSend,
  renderEmail,
  resolveBookingReference,
  resolveHostSupportEmail,
  sendEmail,
} from '@/lib/email';

const EMAIL_TYPE = 'PAYMENT_FAILURE' as const;

type SendPaymentFailureOptions = {
  amountDue: string;
  dueBy: string;
  failureReason: string;
  paymentLink: string;
  lastAttempt?: string;
  stayDatesOverride?: string;
  actionItems?: PaymentFailureActionItem[];
  alternateMethods?: string[];
  supportOverrides?: Partial<PaymentFailureEmailProps['support']>;
  subjectOverride?: string;
  toOverride?: string;
  replyToOverride?: string;
};

function ensureRequired(options: SendPaymentFailureOptions) {
  const requiredFields: Array<keyof SendPaymentFailureOptions> = ['amountDue', 'dueBy', 'failureReason', 'paymentLink'];
  requiredFields.forEach((field) => {
    if (!options[field]) {
      throw new Error(`sendPaymentFailure missing required option: ${String(field)}`);
    }
  });
}

export async function sendPaymentFailure(
  bookingId: number,
  options: SendPaymentFailureOptions,
) {
  ensureRequired(options);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const bookingReference = resolveBookingReference(booking);

  const stayDates = options.stayDatesOverride ?? formatStayDates(new Date(booking.checkInDate), new Date(booking.checkOutDate));
  const lastAttemptLabel = options.lastAttempt ?? 'a few minutes ago';

  const support = {
    email: options.supportOverrides?.email ?? resolveHostSupportEmail(booking),
    phone: options.supportOverrides?.phone,
    concierge: options.supportOverrides?.concierge,
    note: options.supportOverrides?.note,
  } satisfies PaymentFailureEmailProps['support'];

  const html = await renderEmail(
    <PaymentFailureEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      bookingId={bookingReference}
      stayDates={stayDates}
      amountDue={options.amountDue}
      dueBy={options.dueBy}
      failureReason={options.failureReason}
      lastAttempt={lastAttemptLabel}
      paymentLink={options.paymentLink}
      alternateMethods={options.alternateMethods}
      actionItems={options.actionItems}
      support={support}
    />,
  );

  const to = options.toOverride ?? booking.guestEmail;
  const subject = options.subjectOverride ?? `Action required: complete booking ${bookingReference}`;
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
