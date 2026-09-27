import { notAClaim } from '@/lib/email/claims';
import * as React from 'react';
import { prisma } from '@/lib/prisma';
import {
  calculateNights,
  formatCurrencyFromCents,
  formatStayDates,
  renderEmail,
  resolveHostSupportEmail,
  sendEmail,
  logEmailSend,
} from '@/lib/email';
import { ReceiptEmail } from '@/emails/ReceiptEmail';
import { bookingChargeLines } from '@/lib/pricing/breakdown';

const EMAIL_TYPE = 'RECEIPT' as const;

type SendReceiptOptions = {
  force?: boolean;
  paymentSummary?: string;
};

type EmailLogStatus = 'SENT' | 'FAILED';

async function hasReceiptAlreadySent(bookingId: number) {
  const log = await prisma.emailLog.findFirst({
    where: {
      bookingId,
      type: EMAIL_TYPE,
      status: 'SENT',
      ...notAClaim,
    },
  });

  return Boolean(log);
}

export async function sendReceiptEmail(bookingId: number, options: SendReceiptOptions = {}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  if (!options.force) {
    const alreadySent = await hasReceiptAlreadySent(booking.id);
    if (alreadySent) {
      return null;
    }
  }

  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const nights = calculateNights(checkIn, checkOut);
  const stayDates = formatStayDates(checkIn, checkOut);
  // Itemise only when the pricing rules reproduce the amount actually charged.
  const chargeLines = await bookingChargeLines(booking);
  const lineItems = chargeLines
    ? chargeLines.map((line) => ({ label: line.label, amount: formatCurrencyFromCents(line.amountCents) }))
    : [
        {
          label: `Stay · ${nights} night${nights === 1 ? '' : 's'} (incl. fees and taxes)`,
          amount: formatCurrencyFromCents(booking.totalPriceCents),
        },
      ];

  const html = await renderEmail(
    <ReceiptEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      stayDates={stayDates}
      lineItems={lineItems}
      total={formatCurrencyFromCents(booking.totalPriceCents)}
      paymentMethod={options.paymentSummary}
      supportEmail={resolveHostSupportEmail(booking)}
    />
  );

  const sendAndLog = async (status: EmailLogStatus, error?: unknown) => {
    await logEmailSend({
      bookingId: booking.id,
      to: booking.guestEmail,
      type: EMAIL_TYPE,
      status,
      error: error ? String((error as Error)?.message ?? error) : undefined,
    });
  };

  try {
    const response = await sendEmail({
      to: booking.guestEmail,
      subject: `Receipt · ${booking.property.name}`,
      html,
    });

    await sendAndLog('SENT');
    return response;
  } catch (error) {
    await sendAndLog('FAILED', error);
    throw error;
  }
}
