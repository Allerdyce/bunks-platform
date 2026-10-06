import { Booking, Property } from '@prisma/client';
import { toAbsoluteUrl } from '@/lib/url';
import { SUPPORT_EMAIL } from '@/lib/contact';
import { guideUrlForBooking } from '@/lib/guideLinks';

const DEFAULT_CURRENCY = 'USD';

// Stay dates are calendar dates stored as UTC midnight, so always format them in UTC.
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  weekday: 'short',
  month: 'long',
  day: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
});

export function formatDateForEmail(date: Date) {
  return dateFormatter.format(date);
}

export function calculateNights(checkIn: Date, checkOut: Date) {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export function formatCurrencyFromCents(amountCents: number, currency = DEFAULT_CURRENCY) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function resolveGuestBookUrl(booking: Booking & { property: Property }) {
  const url = guideUrlForBooking(booking, booking.guestBookUrlOverride, booking.property.guestBookUrl);
  return toAbsoluteUrl(url ?? undefined);
}

export function resolveCheckInGuideUrl(booking: Booking & { property: Property }) {
  const url =
    guideUrlForBooking(booking, booking.checkInInstructionsOverride, booking.property.checkInGuideUrl);
  return toAbsoluteUrl(url ?? undefined);
}

export function resolveHostSupportEmail(booking: Booking & { property: Property }) {
  return booking.property.hostSupportEmail ?? SUPPORT_EMAIL;
}

export function formatStayDates(checkIn: Date, checkOut: Date) {
  const start = shortDateFormatter.format(checkIn);
  const end = shortDateFormatter.format(checkOut);
  const sameYear = checkIn.getUTCFullYear() === checkOut.getUTCFullYear();
  const year = checkOut.getUTCFullYear();

  if (sameYear) {
    return `${start} – ${end}, ${year}`;
  }

  return `${start}, ${checkIn.getUTCFullYear()} – ${end}, ${year}`;
}

export function resolveBookingReference(booking: Pick<Booking, 'id' | 'publicReference'>) {
  return booking.publicReference ?? `B-${booking.id}`;
}

type StayTimesSource = { checkInTime?: string | null; checkOutTime?: string | null };
type OpsTimes = { checkInWindow?: string | null; checkOutTime?: string | null };

/** Guest-facing check-in/out labels: the property's own times first, then the ops profile. */
export function stayTimeLabels(property: StayTimesSource, ops?: OpsTimes) {
  const checkInTime = property.checkInTime?.trim();
  const checkOutTime = property.checkOutTime?.trim();
  return {
    checkIn: checkInTime ? `Check-in from ${checkInTime}` : ops?.checkInWindow || 'Check-in from 3:00 p.m.',
    checkOut: checkOutTime ? `Checkout by ${checkOutTime}` : ops?.checkOutTime || 'Checkout by 10:00 a.m.',
    checkOutTime: checkOutTime || '10:00 a.m.',
  };
}

/** The guest's first name for greetings ("Hi Alex"), falling back to the full name. */
export function firstNameOf(guestName: string) {
  return guestName.trim().split(/\s+/)[0] || guestName.trim();
}

/** The guest's trip page (arrival details, Wi-Fi, guide; door codes from 24h before check-in). */
export function tripUrlFor(booking: Pick<Booking, 'id' | 'publicReference'>) {
  return toAbsoluteUrl(`/my-trips/${resolveBookingReference(booking)}/essential`) ?? 'https://www.bunks.com/my-trips';
}

/** Admin → Bookings, for links in emails to the Bunks team. */
export function adminBookingsUrl() {
  return toAbsoluteUrl('/admin/messages') ?? 'https://www.bunks.com/admin/messages';
}
