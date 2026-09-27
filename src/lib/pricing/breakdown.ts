import type { Booking, Property } from '@prisma/client';
import { calculatePricing } from '@/lib/pricing/calculator';

export type ChargeLine = { label: string; amountCents: number };

/**
 * Rebuilds the itemised charge for a booking from the pricing rules. Returns null when today's
 * rates no longer reproduce the stored total (rates changed after booking), so callers never show
 * line items that don't add up to what was charged.
 */
export async function bookingChargeLines(
  booking: Pick<Booking, 'checkInDate' | 'checkOutDate' | 'totalPriceCents'> & { property: Pick<Property, 'slug'> },
): Promise<ChargeLine[] | null> {
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
