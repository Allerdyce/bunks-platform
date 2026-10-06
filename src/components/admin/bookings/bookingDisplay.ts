import type { AdminBookingStatus } from "@/components/admin/CancelBookingControl";
import type { AdminPaymentLink } from "@/components/admin/PaymentLinkDetails";
import { getPathSlugFromCanonical } from "@/lib/propertySlugs";

export type BookingView = "upcoming" | "links" | "past" | "cancelled" | "unpaid";

export type BookingDisplayStatus =
  | "upcoming"
  | "staying"
  | "completed"
  | "link-waiting"
  | "link-expired"
  | "checkout-hold"
  | "abandoned"
  | "cancelled";

/** A booking as Admin → Bookings lists it (GET /api/admin/bookings/messages). */
export type AdminBooking = {
  id: number;
  referenceCode: string | null;
  guestName: string;
  guestEmail: string;
  guestCount: number | null;
  checkInDate: string;
  checkOutDate: string;
  createdAt: string;
  nights: number;
  status: AdminBookingStatus;
  displayStatus: BookingDisplayStatus;
  totalPriceCents: number;
  wasPaid: boolean;
  source: "checkout" | "link";
  holdExpired: boolean;
  paymentLink: (AdminPaymentLink & { holdUntilIso: string | null }) | null;
  property: { id: number; name: string; slug: string; hostSupportEmail?: string | null };
};

export const VIEW_TABS: { view: BookingView; label: string }[] = [
  { view: "upcoming", label: "Upcoming" },
  { view: "links", label: "Payment links" },
  { view: "past", label: "Past" },
  { view: "cancelled", label: "Cancelled" },
  { view: "unpaid", label: "Unpaid" },
];

export const STATUS_STYLE: Record<BookingDisplayStatus, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "bg-emerald-50 text-emerald-700" },
  staying: { label: "Staying now", className: "bg-sky-50 text-sky-700" },
  completed: { label: "Completed", className: "bg-gray-100 text-gray-600" },
  "link-waiting": { label: "Awaiting payment", className: "bg-amber-50 text-amber-700" },
  "link-expired": { label: "Link expired", className: "bg-gray-100 text-gray-600" },
  "checkout-hold": { label: "Paying now", className: "bg-amber-50 text-amber-700" },
  abandoned: { label: "Abandoned checkout", className: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700" },
};

// Stay dates are calendar dates stored as UTC midnight.
const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** "Oct 19 – 23", "Oct 30 – Nov 2", with the year when it isn't this year. */
export function formatStayRange(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();
  const range = sameMonth ? `${monthDay.format(start)} – ${end.getUTCDate()}` : `${monthDay.format(start)} – ${monthDay.format(end)}`;
  return end.getUTCFullYear() === new Date().getUTCFullYear() ? range : `${range}, ${end.getUTCFullYear()}`;
}

export const stayMonth = (checkIn: string) => monthYear.format(new Date(checkIn));

export const formatMoney = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

/** "Steamboat", "Summerland": the short name the site uses in its own URLs. */
export function shortHomeName(slug: string, name: string) {
  const short = getPathSlugFromCanonical(slug);
  return short === slug ? name : short.charAt(0).toUpperCase() + short.slice(1);
}

/** "expires in 31h" / "expires in 20 min" for a waiting payment link. */
export function expiresIn(holdUntilIso: string | null) {
  if (!holdUntilIso) return null;
  const minutes = Math.round((new Date(holdUntilIso).getTime() - Date.now()) / 60_000);
  if (minutes <= 0) return "expired";
  if (minutes < 90) return `expires in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `expires in ${hours}h` : `expires in ${Math.round(hours / 24)} days`;
}

/** Heading for the list section a booking falls under, per tab. */
export function groupLabel(view: BookingView | "search", booking: AdminBooking) {
  if (view === "links") {
    if (booking.displayStatus === "link-waiting") return "Waiting for payment";
    if (booking.status === "PAID") return "Paid";
    if (booking.displayStatus === "link-expired") return "Expired";
    return booking.wasPaid ? "Paid, then cancelled" : "Cancelled";
  }
  if (view === "unpaid") return booking.displayStatus === "checkout-hold" ? "Paying now" : "Abandoned checkouts";
  return stayMonth(booking.checkInDate);
}
