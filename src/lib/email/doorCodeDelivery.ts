import type { Booking, Property } from '@prisma/client';
import { claimEmail, completeClaim, releaseClaim } from '@/lib/email/claims';
import { sendDoorCodeEmail } from '@/lib/email/sendDoorCodeEmail';
import { propertyToday } from '@/lib/stayRules';

const DAY_MS = 86_400_000;

// The building entry code; ski-locker codes are listed inside the email, not used as the door code.
export function resolveDoorCode(property: Pick<Property, 'lockboxCode' | 'garageCode'>) {
  return property.lockboxCode || property.garageCode || null;
}

/**
 * Sends the door-code email right away if the stay is already inside the delivery window
 * (from the day before check-in). The daily cron handles every other booking; this covers
 * guests who book after that morning's run for a check-in today or tomorrow.
 */
export async function sendDoorCodeIfDue(booking: Booking & { property: Property }) {
  const code = resolveDoorCode(booking.property);
  if (!code) return null;
  const today = propertyToday(booking.property.timezone).getTime();
  const firstDay = booking.checkInDate.getTime() - DAY_MS;
  const lastDay = booking.checkOutDate.getTime() - DAY_MS;
  if (today < firstDay || today > lastDay) return null;

  const target = { type: 'DOOR_CODE_DELIVERY' as const, to: booking.guestEmail, bookingId: booking.id };
  const claimId = await claimEmail(target);
  if (claimId === null) return null;
  try {
    const result = await sendDoorCodeEmail(booking.id, { doorCode: code });
    if (result) await completeClaim(claimId, target);
    else await releaseClaim(claimId);
    return result;
  } catch (error) {
    await releaseClaim(claimId);
    throw error;
  }
}
