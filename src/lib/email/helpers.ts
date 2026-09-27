import { Booking, Property } from '@prisma/client';
import { toAbsoluteUrl } from '@/lib/url';
import { SUPPORT_EMAIL } from '@/lib/contact';
import { guideUrlFor } from '@/data/guides';

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
  const url = guideUrlFor(booking.property.slug, booking.guestBookUrlOverride, booking.property.guestBookUrl);
  return toAbsoluteUrl(url ?? undefined);
}

export function resolveCheckInGuideUrl(booking: Booking & { property: Property }) {
  const url =
    guideUrlFor(booking.property.slug, booking.checkInInstructionsOverride, booking.property.checkInGuideUrl);
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

  return `${start}, ${checkIn.getFullYear()} – ${end}, ${year}`;
}

export function resolveBookingReference(booking: Pick<Booking, 'id' | 'publicReference'>) {
  return booking.publicReference ?? `B-${booking.id}`;
}
