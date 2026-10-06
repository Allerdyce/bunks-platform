import type { Booking, Property } from '@prisma/client';
import { calculatePricing } from '@/lib/pricing/calculator';

export type ChargeLine = { label: string; amountCents: number };

type StoredCharges = Pick<Booking, 'nightlySubtotalCents' | 'cleaningFeeCents' | 'serviceFeeCents' | 'taxCents'>;

const nightsLabel = (nights: number) => `${nights} night${nights === 1 ? '' : 's'}`;

/** The charge stored with the booking (payment links, priced by an admin), if it adds up. */
function storedChargeLines(
  booking: Partial<StoredCharges> & Pick<Booking, 'checkInDate' | 'checkOutDate' | 'totalPriceCents'>,
): ChargeLine[] | null {
  const { nightlySubtotalCents: nightly, cleaningFeeCents: cleaning, serviceFeeCents: service, taxCents: tax } = booking;
  if (nightly == null || cleaning == null || service == null || tax == null) return null;
  if (nightly + cleaning + service + tax !== booking.totalPriceCents) return null;
  const nights = Math.round((booking.checkOutDate.getTime() - booking.checkInDate.getTime()) / 86_400_000);
  const lines: ChargeLine[] = [{ label: nightsLabel(nights), amountCents: nightly }];
  if (cleaning > 0) lines.push({ label: 'Cleaning fee', amountCents: cleaning });
  if (service > 0) lines.push({ label: 'Service fee', amountCents: service });
  if (tax > 0) lines.push({ label: 'Taxes', amountCents: tax });
  return lines;
}

/**
 * The itemised charge for a booking: as stored when an admin priced it (payment links), otherwise
 * rebuilt from the pricing rules. Returns null when neither adds up to the amount charged (rates
 * changed after booking), so callers never show line items that don't match what was charged.
 */
export async function bookingChargeLines(
  booking: Pick<Booking, 'checkInDate' | 'checkOutDate' | 'totalPriceCents'> &
    Partial<StoredCharges> & { property: Pick<Property, 'slug'> },
): Promise<ChargeLine[] | null> {
  const stored = storedChargeLines(booking);
  if (stored) return stored;
  try {
    const quote = await calculatePricing(booking.property.slug, booking.checkInDate, booking.checkOutDate, 1);
    if (quote.totalPriceCents !== booking.totalPriceCents) return null;
    const lines: ChargeLine[] = [
      {
        label: `${quote.nights} night${quote.nights === 1 ? '' : 's'} (10% direct-booking discount applied)`,
        amountCents: quote.nightlySubtotalCents,
      },
    ];
    if (quote.cleaningFeeCents > 0) lines.push({ label: 'Cleaning fee', amountCents: quote.cleaningFeeCents });
    if (quote.serviceFeeCents > 0) lines.push({ label: 'Service fee', amountCents: quote.serviceFeeCents });
    if (quote.taxCents > 0) lines.push({ label: 'Taxes', amountCents: quote.taxCents });
    return lines;
  } catch (error) {
    console.error('[pricing] Could not rebuild booking breakdown', error);
    return null;
  }
}
