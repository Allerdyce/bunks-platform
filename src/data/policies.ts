// Single source of truth for guest-facing booking policies.
// Confirmed by the owner 27 Sep 2026. Admin → Bookings pre-selects refunds from these tiers
// (src/components/admin/CancelBookingControl.tsx), so change both together.
export const CANCELLATION_POLICY = {
  summary:
    "Full refund if you cancel at least 30 days before check-in. 50% refund if you cancel 7–30 days before check-in. No refund within 7 days of check-in.",
};
