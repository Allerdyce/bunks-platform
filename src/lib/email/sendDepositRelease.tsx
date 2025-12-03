import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { DepositReleaseEmail } from '@/emails/DepositReleaseEmail';
import type { DepositAdjustmentItem, DepositReleaseEmailProps } from '@/emails/DepositReleaseEmail';
import {
  formatDateForEmail,
  formatStayDates,
  logEmailSend,
  renderEmail,
  resolveBookingReference,
  resolveHostSupportEmail,
  sendEmail,
} from '@/lib/email';

const EMAIL_TYPE = 'DEPOSIT_RELEASE' as const;

type SendDepositReleaseOptions = {
  depositAmount: string;
  method: string;
  expectedTimeline: string;
  releasedAtLabel?: string;
  descriptor?: string;
  stayDatesOverride?: string;
  adjustments?: DepositAdjustmentItem[];
  note?: string;
  tips?: string[];
  supportOverrides?: Partial<DepositReleaseEmailProps['support']>;
  subjectOverride?: string;
  toOverride?: string;
  replyToOverride?: string;
};

function ensureRequired(options: SendDepositReleaseOptions) {
  const required: Array<keyof SendDepositReleaseOptions> = ['depositAmount', 'method', 'expectedTimeline'];
  required.forEach((field) => {
    if (!options[field]) {
      throw new Error(`sendDepositRelease missing required option: ${String(field)}`);
    }
  });
}

export async function sendDepositRelease(
  bookingId: number,
  options: SendDepositReleaseOptions,
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
  const releasedAt = options.releasedAtLabel ?? formatDateForEmail(new Date());

  const support = {
    email: options.supportOverrides?.email ?? resolveHostSupportEmail(booking),
    phone: options.supportOverrides?.phone,
    concierge: options.supportOverrides?.concierge,
    note: options.supportOverrides?.note,
  } satisfies DepositReleaseEmailProps['support'];

  const html = await renderEmail(
    <DepositReleaseEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      bookingId={bookingReference}
      stayDates={stayDates}
      releasedAt={releasedAt}
      depositAmount={options.depositAmount}
      method={options.method}
      expectedTimeline={options.expectedTimeline}
      descriptor={options.descriptor}
      adjustments={options.adjustments}
      note={options.note}
      tips={options.tips}
      support={support}
    />,
  );

  const to = options.toOverride ?? booking.guestEmail;
  const subject = options.subjectOverride ?? `Security deposit released · Booking ${bookingReference}`;
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
