import { notAClaim } from '@/lib/email/claims';
import * as React from 'react';
import type { Property } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  firstNameOf,
  formatDateForEmail,
  logEmailSend,
  renderEmail,
  resolveBookingReference,
  resolveHostSupportEmail,
  sendEmail,
  stayTimeLabels,
  tripUrlFor,
} from '@/lib/email';
import { DoorCodeEmail, type DoorCodeInstruction } from '@/emails/DoorCodeEmail';
import { mapsUrlFor, privateDetailsFor, wifiFor } from '@/lib/privatePropertyDetails';
import { propertyToday, resolvePropertyTimeZone } from '@/lib/stayRules';

const EMAIL_TYPE = 'DOOR_CODE_DELIVERY' as const;
const DAY_MS = 86_400_000;

// The building entry code; ski-locker codes are listed inside the email, not used as the door code.
export function resolveDoorCode(property: Pick<Property, 'lockboxCode' | 'garageCode'>) {
  return property.lockboxCode || property.garageCode || null;
}

type PropertyAccess = {
  slug: string;
  lockboxCode: string | null;
  garageCode: string | null;
  skiLockerDoorCode: string | null;
  skiLockerNumber: string | null;
  skiLockerCode: string | null;
  parkingNotes: string | null;
};

/** Entry details built only from what's stored for the property; nothing is invented. */
export function buildAccessDetails(property: PropertyAccess) {
  const entrySteps: DoorCodeInstruction[] = [];
  if (property.lockboxCode && property.garageCode) {
    entrySteps.push({ title: 'Garage code', detail: property.garageCode });
  }
  if (property.skiLockerDoorCode) {
    entrySteps.push({ title: 'Ski locker room door', detail: property.skiLockerDoorCode });
  }
  if (property.skiLockerNumber || property.skiLockerCode) {
    entrySteps.push({
      title: 'Ski locker',
      detail: [property.skiLockerNumber && `Locker ${property.skiLockerNumber}`, property.skiLockerCode && `code ${property.skiLockerCode}`]
        .filter(Boolean)
        .join(' · '),
    });
  }
  const parking = property.parkingNotes?.trim() || privateDetailsFor(property.slug)?.parkingNotes;
  const parkingInfo: DoorCodeInstruction[] = parking ? [{ title: 'Where to park', detail: parking }] : [];
  return { entrySteps, parkingInfo };
}

function arrivalHeadline(checkIn: Date, today: Date) {
  const days = Math.round((checkIn.getTime() - today.getTime()) / DAY_MS);
  if (days === 0) return 'See you today';
  if (days === 1) return 'See you tomorrow';
  if (days < 0) return 'Your arrival details';
  return `See you on ${formatDateForEmail(checkIn)}`;
}

/**
 * The guest's arrival details (door code when the home has one, address, Wi-Fi, parking), sent
 * from the day before check-in. Sent once per booking unless forced.
 */
export async function sendDoorCodeEmail(bookingId: number, options: { force?: boolean } = {}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  if (!options.force) {
    const alreadySent = await prisma.emailLog.findFirst({
      where: { bookingId: booking.id, type: EMAIL_TYPE, status: 'SENT', ...notAClaim },
    });
    if (alreadySent) {
      return null;
    }
  }

  const { property } = booking;
  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const times = stayTimeLabels(property);
  const access = buildAccessDetails(property);
  const wifi = wifiFor(property.slug, property);
  const address = privateDetailsFor(property.slug)?.address ?? null;
  const today = propertyToday(resolvePropertyTimeZone(property));

  const html = await renderEmail(
    <DoorCodeEmail
      guestFirstName={firstNameOf(booking.guestName)}
      propertyName={property.name}
      arrivalHeadline={arrivalHeadline(checkIn, today)}
      checkIn={`${formatDateForEmail(checkIn)} · ${times.checkIn.replace(/^Check-in /, '')}`}
      checkOut={`${formatDateForEmail(checkOut)} · ${times.checkOut.replace(/^Checkout /, '')}`}
      address={address}
      mapsUrl={address ? mapsUrlFor(address) : null}
      codeLabel={property.lockboxCode ? 'Lockbox code' : 'Entry code'}
      doorCode={resolveDoorCode(property)}
      entrySteps={access.entrySteps}
      parkingInfo={access.parkingInfo}
      wifi={wifi ? { network: wifi.ssid, password: wifi.password } : null}
      tripUrl={tripUrlFor(booking)}
      bookingReference={resolveBookingReference(booking)}
      supportEmail={resolveHostSupportEmail(booking)}
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
      replyTo: resolveHostSupportEmail(booking),
      subject: `Arrival details · ${property.name} · ${formatDateForEmail(checkIn)}`,
      html,
    });

    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
