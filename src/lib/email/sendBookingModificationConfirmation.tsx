import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { BookingModificationEmail } from '@/emails/BookingModificationEmail';
import type {
  BookingModificationEmailProps,
  ChargeAdjustmentItem,
  ModificationChangeItem,
  ModificationTaskItem,
} from '@/emails/BookingModificationEmail';
import {
  calculateNights,
  formatDateForEmail,
  formatStayDates,
  logEmailSend,
  renderEmail,
  resolveBookingReference,
  resolveHostSupportEmail,
  sendEmail,
} from '@/lib/email';
import { getAppBaseUrl } from '@/lib/url';

const EMAIL_TYPE = 'BOOKING_MODIFICATION' as const;

type BookingModificationOptions = {
  previousDates?: string;
  newDates?: string;
  nightsSummary?: string;
  headcount?: string;
  changeReason?: string;
  checkInWindow?: string;
  manageBookingUrl?: string;
  changeItems?: ModificationChangeItem[];
  chargeAdjustments?: ChargeAdjustmentItem[];
  financialSummary?: BookingModificationEmailProps['financialSummary'];
  tasks?: ModificationTaskItem[];
  nextSteps?: string[];
  updatedAtLabel?: string;
  supportOverrides?: Partial<BookingModificationEmailProps['support']>;
  toOverride?: string;
  subjectOverride?: string;
  replyToOverride?: string;
};

function buildDefaultChangeItems(stayDates: string): ModificationChangeItem[] {
  return [
    {
      label: 'Stay dates',
      previous: 'As previously confirmed',
      updated: stayDates,
    },
    {
      label: 'Guests',
      previous: 'Original headcount',
      updated: 'Current headcount',
      note: 'Message us if you add extra guests so we can restock amenities.',
    },
  ];
}

export async function sendBookingModificationConfirmation(
  bookingId: number,
  options: BookingModificationOptions = {},
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const bookingReference = resolveBookingReference(booking);

  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const stayDates = formatStayDates(checkIn, checkOut);
  const nights = calculateNights(checkIn, checkOut);

  const updatedAtLabel = options.updatedAtLabel ?? formatDateForEmail(new Date());
  const newDates = options.newDates ?? stayDates;
  const nightsSummary = options.nightsSummary ?? `${nights} night${nights === 1 ? '' : 's'} · ${newDates}`;

  const support = {
    email: options.supportOverrides?.email ?? resolveHostSupportEmail(booking),
    phone: options.supportOverrides?.phone,
    concierge: options.supportOverrides?.concierge,
    note: options.supportOverrides?.note,
  } satisfies BookingModificationEmailProps['support'];

  const manageBookingParams = new URLSearchParams({
    view: 'booking-details',
    lookup: bookingReference,
    email: booking.guestEmail,
  });
  const defaultManageBookingUrl = `${getAppBaseUrl()}/?${manageBookingParams.toString()}`;

  const html = await renderEmail(
    <BookingModificationEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      bookingId={bookingReference}
      updatedAt={updatedAtLabel}
      previousDates={options.previousDates ?? 'Original schedule on file'}
      newDates={newDates}
      nightsSummary={nightsSummary}
      headcount={options.headcount}
      changeReason={options.changeReason}
      checkInWindow={options.checkInWindow ?? 'Check-in opens at 16:00 local time'}
      manageBookingUrl={options.manageBookingUrl ?? defaultManageBookingUrl}
      changeItems={options.changeItems ?? buildDefaultChangeItems(newDates)}
      chargeAdjustments={options.chargeAdjustments}
      financialSummary={options.financialSummary}
      tasks={options.tasks}
      nextSteps={options.nextSteps}
      support={support}
    />,
  );

  const to = options.toOverride ?? booking.guestEmail;
  const subject = options.subjectOverride ?? `Booking updated · ${booking.property.name}`;
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
