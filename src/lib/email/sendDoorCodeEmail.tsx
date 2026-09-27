import { notAClaim } from '@/lib/email/claims';
import * as React from 'react';
import { prisma } from '@/lib/prisma';
import {
  formatDateForEmail,
  formatStayDates,
  logEmailSend,
  renderEmail,
  resolveBookingReference,
  resolveHostSupportEmail,
  sendEmail,
} from '@/lib/email';
import { DoorCodeEmail, type DoorCodeInstruction } from '@/emails/DoorCodeEmail';

const EMAIL_TYPE = 'DOOR_CODE_DELIVERY' as const;

type PropertyAccess = {
  lockboxCode: string | null;
  garageCode: string | null;
  skiLockerDoorCode: string | null;
  skiLockerNumber: string | null;
  skiLockerCode: string | null;
  parkingNotes: string | null;
};

/** Entry details built only from what's stored on the property; nothing is invented. */
export function buildAccessDetails(property: PropertyAccess) {
  const entrySteps: DoorCodeInstruction[] = [];
  if (property.lockboxCode && property.garageCode) {
    entrySteps.push({ title: 'Garage code', detail: property.garageCode });
  }
  if (property.skiLockerDoorCode) {
    entrySteps.push({ title: 'Ski locker room door', detail: `Code ${property.skiLockerDoorCode}` });
  }
  if (property.skiLockerNumber || property.skiLockerCode) {
    entrySteps.push({
      title: 'Ski locker',
      detail: [property.skiLockerNumber && `Locker ${property.skiLockerNumber}`, property.skiLockerCode && `code ${property.skiLockerCode}`]
        .filter(Boolean)
        .join(' · '),
    });
  }
  const parkingInfo: DoorCodeInstruction[] = property.parkingNotes?.trim()
    ? [{ title: 'Where to park', detail: property.parkingNotes.trim() }]
    : [];
  return { entrySteps, parkingInfo };
}

interface SendDoorCodeOptions {
  doorCode: string;
  codeLabel?: string;
  codeValidWindow?: string;
  arrivalWindow?: string;
  parkingInfo?: DoorCodeInstruction[];
  entrySteps?: DoorCodeInstruction[];
  wifi?: { network: string; password: string };
  backupPlan?: DoorCodeInstruction[];
  securityNotes?: string[];
  supportPhone?: string;
  conciergePhone?: string;
  supportNote?: string;
  force?: boolean;
}

export async function sendDoorCodeEmail(bookingId: number, options: SendDoorCodeOptions) {
  if (!options?.doorCode) {
    throw new Error('doorCode is required to send the Door Code email.');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const bookingReference = resolveBookingReference(booking);

  if (!options.force) {
    const alreadySent = await prisma.emailLog.findFirst({
      where: { bookingId: booking.id, type: EMAIL_TYPE, status: 'SENT', ...notAClaim },
    });

    if (alreadySent) {
      return null;
    }
  }

  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const stayDates = formatStayDates(checkIn, checkOut);
  const supportEmail = resolveHostSupportEmail(booking);

  const access = buildAccessDetails(booking.property);
  const wifi =
    options.wifi ??
    (booking.property.wifiSsid && booking.property.wifiPassword
      ? { network: booking.property.wifiSsid, password: booking.property.wifiPassword }
      : undefined);
  const checkInTime = booking.property.checkInTime?.trim();

  const html = await renderEmail(
    <DoorCodeEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      arrivalDate={formatDateForEmail(checkIn)}
      arrivalWindow={options.arrivalWindow ?? (checkInTime ? `Self check-in from ${checkInTime}` : 'Self check-in')}
      doorCode={options.doorCode}
      codeLabel={options.codeLabel ?? (booking.property.lockboxCode ? 'Lockbox code' : 'Entry code')}
      codeValidWindow={options.codeValidWindow}
      parkingInfo={options.parkingInfo ?? access.parkingInfo}
      entrySteps={options.entrySteps ?? access.entrySteps}
      wifi={wifi}
      backupPlan={options.backupPlan}
      securityNotes={options.securityNotes}
      support={{
        email: supportEmail,
        phone: options.supportPhone,
        concierge: options.conciergePhone,
        note: options.supportNote ?? `Reference booking ${bookingReference} (${stayDates}) when you contact us.`,
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
      subject: `Door code · ${booking.property.name}`,
      html,
    });

    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
