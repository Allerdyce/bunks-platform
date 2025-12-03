import * as React from 'react';
import { prisma } from '@/lib/prisma';
import {
  formatDateForEmail,
  logEmailSend,
  renderEmail,
  resolveHostSupportEmail,
  sendEmail,
} from '@/lib/email';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { AddOnConfirmationEmail } from '@/emails/AddOnConfirmationEmail';
import type { AddOnDetail } from '@/emails/AddOnConfirmationEmail';
import { toAbsoluteUrl } from '@/lib/url';

const EMAIL_TYPE = 'ADDON_CONFIRMATION' as const;

type AddOnConfirmationOptions = {
  addOns: AddOnDetail[];
  manageAddOnsUrl?: string;
  guestBookUrl?: string;
  total?: string;
  paymentMethod?: string;
  chargedAt?: string;
  cancellationWindow?: string;
  checklist?: string[];
  supportEmail?: string;
  supportPhone?: string;
  conciergePhone?: string;
  supportNote?: string;
  arrivalDateOverride?: string;
  force?: boolean;
};

async function hasAlreadySent(bookingId: number) {
  const log = await prisma.emailLog.findFirst({
    where: { bookingId, type: EMAIL_TYPE, status: 'SENT' },
  });
  return Boolean(log);
}

export async function sendAddOnConfirmation(bookingId: number, options: AddOnConfirmationOptions) {
  if (!options?.force) {
    const addonsEnabled = await isFeatureEnabled('addons');
    if (!addonsEnabled) {
      console.info('sendAddOnConfirmation skipped — add-on marketplace feature flag disabled.');
      return null;
    }
  }

  if (!options?.addOns || options.addOns.length === 0) {
    throw new Error('sendAddOnConfirmation requires at least one add-on payload.');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  if (!options.force) {
    const alreadySent = await hasAlreadySent(booking.id);
    if (alreadySent) {
      return null;
    }
  }

  const supportEmail = options.supportEmail ?? resolveHostSupportEmail(booking);
  const arrivalDate = options.arrivalDateOverride ?? `${formatDateForEmail(new Date(booking.checkInDate))}`;

  const html = await renderEmail(
    <AddOnConfirmationEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      arrivalDate={arrivalDate}
      addOns={options.addOns}
      manageAddOnsUrl={options.manageAddOnsUrl}
      guestBookUrl={toAbsoluteUrl(options.guestBookUrl)}
      total={options.total}
      paymentMethod={options.paymentMethod}
      chargedAt={options.chargedAt}
      cancellationWindow={options.cancellationWindow}
      checklist={options.checklist}
      support={{
        email: supportEmail,
        phone: options.supportPhone,
        concierge: options.conciergePhone,
        note: options.supportNote,
      }}
    />,
  );

  const logResult = async (status: 'SENT' | 'FAILED', error?: unknown) => {
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
      subject: `Add-ons confirmed · ${booking.property.name}`,
      html,
    });

    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
