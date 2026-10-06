import type { Booking, Property } from '@prisma/client';
import { claimEmail, completeClaim, releaseClaim } from '@/lib/email/claims';
import { sendDoorCodeEmail } from '@/lib/email/sendDoorCodeEmail';
import { propertyToday, resolvePropertyTimeZone } from '@/lib/stayRules';

export { resolveDoorCode } from '@/lib/email/sendDoorCodeEmail';

const DAY_MS = 86_400_000;

/**
 * Sends the arrival-details email right away if the stay is already inside the delivery window
 * (from the day before check-in). The daily cron handles every other booking; this covers
 * guests who book after that morning's run for a check-in today or tomorrow.
 */
export async function sendDoorCodeIfDue(booking: Booking & { property: Property }) {
  const today = propertyToday(resolvePropertyTimeZone(booking.property)).getTime();
  const firstDay = booking.checkInDate.getTime() - DAY_MS;
  const lastDay = booking.checkOutDate.getTime() - DAY_MS;
  if (today < firstDay || today > lastDay) return null;

  const target = { type: 'DOOR_CODE_DELIVERY' as const, to: booking.guestEmail, bookingId: booking.id };
  const claimId = await claimEmail(target);
  if (claimId === null) return null;
  try {
    const result = await sendDoorCodeEmail(booking.id);
    if (result) await completeClaim(claimId, target);
    else await releaseClaim(claimId);
    return result;
  } catch (error) {
    await releaseClaim(claimId);
    throw error;
  }
}
