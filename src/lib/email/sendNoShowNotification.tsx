import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { NoShowNotificationEmail } from '@/emails/NoShowNotificationEmail';
import type {
  NoShowChargeLine,
  NoShowNextStep,
  NoShowNotificationEmailProps,
} from '@/emails/NoShowNotificationEmail';
import {
  formatDateForEmail,
  formatStayDates,
  logEmailSend,
  renderEmail,
  resolveBookingReference,
  resolveHostSupportEmail,
  sendEmail,
} from '@/lib/email';

const EMAIL_TYPE = 'NO_SHOW_NOTIFICATION' as const;

type SendNoShowNotificationOptions = {
  stayDatesOverride?: string;
  reportedAtLabel?: string;
  checkInWindow?: string;
  arrivalStatus?: string;
  charges?: NoShowChargeLine[];
  totalRetained?: string;
  retentionNote?: string;
  nextSteps?: NoShowNextStep[];
  rebookOffer?: NoShowNotificationEmailProps['rebookOffer'];
  supportOverrides?: Partial<NoShowNotificationEmailProps['support']>;
  subjectOverride?: string;
  toOverride?: string;
  replyToOverride?: string;
};

function defaultNextSteps(): NoShowNextStep[] {
  return [
    {
      label: 'Running late?',
      detail: 'Reply with your updated ETA so we can attempt to re-open the calendar for you.',
    },
    {
      label: 'Need to rebook?',
      detail: 'We can apply eligible credits toward a future stay if you reach out within 24 hours.',
    },
  ];
}

export async function sendNoShowNotification(
  bookingId: number,
  options: SendNoShowNotificationOptions = {},
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const bookingReference = resolveBookingReference(booking);

  const stayDates = options.stayDatesOverride ?? formatStayDates(new Date(booking.checkInDate), new Date(booking.checkOutDate));
  const reportedAt = options.reportedAtLabel ?? formatDateForEmail(new Date());
  const checkInWindow = options.checkInWindow ?? '16:00 – 22:00 local time';
  const arrivalStatus = options.arrivalStatus ?? 'No guest arrival detected';

  const support = {
    email: options.supportOverrides?.email ?? resolveHostSupportEmail(booking),
    phone: options.supportOverrides?.phone,
    concierge: options.supportOverrides?.concierge,
    note: options.supportOverrides?.note,
  } satisfies NoShowNotificationEmailProps['support'];

  const html = await renderEmail(
    <NoShowNotificationEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      bookingId={bookingReference}
      stayDates={stayDates}
      reportedAt={reportedAt}
      checkInWindow={checkInWindow}
      arrivalStatus={arrivalStatus}
      charges={options.charges}
      totalRetained={options.totalRetained}
      retentionNote={options.retentionNote}
      nextSteps={options.nextSteps ?? defaultNextSteps()}
      rebookOffer={options.rebookOffer}
      support={support}
    />,
  );

  const to = options.toOverride ?? booking.guestEmail;
  const subject = options.subjectOverride ?? `No-show recorded · Booking ${bookingReference}`;
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
