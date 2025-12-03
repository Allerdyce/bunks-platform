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

const DEFAULT_PARKING: DoorCodeInstruction[] = [
  {
    title: 'Driveway parking',
    detail: 'Park nose-in. Plowed daily – keep two tyres on the gravel strip to avoid drifting snow berms.',
  },
  {
    title: 'Overflow option',
    detail: 'Use the marked gravel lot across the lane. Display the hanging permit from the mudroom hook.',
  },
];

const DEFAULT_ENTRY_STEPS: DoorCodeInstruction[] = [
  { title: 'Keypad location', detail: 'Mounted to the left of the mudroom door beneath the covered awning.' },
  { title: 'Wake the lock', detail: 'Tap ✷ to wake, enter the code, then press # within 5 seconds.' },
  { title: 'Locking up', detail: 'When leaving, press ✷ once. Wait for the green flash + chime before walking away.' },
];

const DEFAULT_BACKUP_STEPS: DoorCodeInstruction[] = [
  { title: 'Backup lockbox', detail: 'Code 7711 · mounted behind the propane cover near the wood shed.' },
  { title: 'Manual key', detail: 'Key inside lockbox – please return it immediately after use.' },
];

const DEFAULT_SECURITY_NOTES = [
  'Disarm the panel in the entry hall within 60 seconds of unlocking.',
  'Always lock doors when you head out – elk are oddly talented with levers.',
];

interface SendDoorCodeOptions {
  doorCode: string;
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
      where: { bookingId: booking.id, type: EMAIL_TYPE, status: 'SENT' },
    });

    if (alreadySent) {
      return null;
    }
  }

  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const stayDates = formatStayDates(checkIn, checkOut);
  const supportEmail = resolveHostSupportEmail(booking);

  const html = await renderEmail(
    <DoorCodeEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      arrivalDate={formatDateForEmail(checkIn)}
      arrivalWindow={options.arrivalWindow ?? 'Self check-in · After 16:00'}
      doorCode={options.doorCode}
      codeValidWindow={options.codeValidWindow ?? `Active ${formatDateForEmail(checkIn)} 12:00 – ${formatDateForEmail(checkOut)} 12:00`}
      parkingInfo={options.parkingInfo ?? DEFAULT_PARKING}
      entrySteps={options.entrySteps ?? DEFAULT_ENTRY_STEPS}
      wifi={options.wifi}
      backupPlan={options.backupPlan ?? DEFAULT_BACKUP_STEPS}
      securityNotes={options.securityNotes ?? DEFAULT_SECURITY_NOTES}
      support={{
        email: supportEmail,
        phone: options.supportPhone,
        concierge: options.conciergePhone,
        note: options.supportNote ?? `Reference booking ${bookingReference} (${stayDates}) if you call or text.`,
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
