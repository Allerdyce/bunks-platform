// Stay rules shared by the booking API, the public quote and the calendar feed.
const PROPERTY_MINIMUM_NIGHTS: Record<string, number> = {
  'summerland-ocean-view-beach-bungalow': 3,
  'steamboat-downtown-townhome': 3,
};

export const DEFAULT_MINIMUM_NIGHTS = 1;
// Longer stays and far-future dates are handled by email, not online checkout.
export const MAX_NIGHTS = 60;
export const BOOKING_HORIZON_DAYS = 730;

const DAY_MS = 86_400_000;

export function minimumNightsFor(slug: string) {
  return PROPERTY_MINIMUM_NIGHTS[slug] ?? DEFAULT_MINIMUM_NIGHTS;
}

/** Today's calendar date at the property (UTC midnight), so "today" means the guest-facing local day. */
export function propertyToday(timezone: string | null | undefined, now = new Date()) {
  let local: string;
  try {
    local = new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'America/Denver' }).format(now);
  } catch {
    local = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver' }).format(now);
  }
  return new Date(`${local}T00:00:00.000Z`);
}

export type StayRuleViolation = {
  error: 'PAST_DATE' | 'MINIMUM_STAY' | 'MAXIMUM_STAY' | 'TOO_FAR_AHEAD' | 'INVALID_RANGE';
  message: string;
  minimumNights?: number;
};

/** Checks a [checkIn, checkOut) stay (UTC-midnight dates) against the property's rules. */
export function checkStayRules(
  property: { slug: string; timezone?: string | null },
  checkIn: Date,
  checkOut: Date,
  now = new Date(),
): StayRuleViolation | null {
  if (checkOut <= checkIn) {
    return { error: 'INVALID_RANGE', message: 'Check-out must be after check-in.' };
  }
  const today = propertyToday(property.timezone, now);
  if (checkIn < today) {
    return { error: 'PAST_DATE', message: 'Check-in date is in the past.' };
  }
  if (checkIn.getTime() - today.getTime() > BOOKING_HORIZON_DAYS * DAY_MS) {
    return { error: 'TOO_FAR_AHEAD', message: 'Those dates are too far ahead to book online. Please email us.' };
  }
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
  const minimumNights = minimumNightsFor(property.slug);
  if (nights < minimumNights) {
    return {
      error: 'MINIMUM_STAY',
      message: `This home has a ${minimumNights}-night minimum stay.`,
      minimumNights,
    };
  }
  if (nights > MAX_NIGHTS) {
    return { error: 'MAXIMUM_STAY', message: `Stays longer than ${MAX_NIGHTS} nights are booked by email. Please get in touch.` };
  }
  return null;
}
