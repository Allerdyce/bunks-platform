import type {
  BookingDetailsResponse,
  BookingRequest,
  BookingResponse,
  Property,
  TripAccessResponse,
} from "@/types";

// Browser calls to the Bunks API.
export const api = {
  async createBooking(booking: BookingRequest): Promise<BookingResponse> {
    const res = await fetch(`/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });
    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      const errorPayload = (data ?? null) as { message?: string; error?: string } | null;
      const message = errorPayload?.message || errorPayload?.error || text || "Failed to create booking";
      const error = new Error(typeof message === "string" ? message : "Failed to create booking");
      (error as Error & { details?: unknown }).details = data ?? undefined;
      throw error;
    }

    if (!data) {
      throw new Error("Unexpected empty response from booking API");
    }

    return data as BookingResponse;
  },
  async fetchBlockedDates(slug: Property["slug"]): Promise<{ blockedDates: string[]; minStay: Record<string, number> }> {
    const res = await fetch(`/api/properties/${slug}/blocked-dates`);
    if (!res.ok) {
      throw new Error("Failed to fetch blocked dates");
    }
    const data = await res.json();
    return {
      blockedDates: data.blockedDates?.map((entry: { date: string }) => entry.date) ?? [],
      minStay: data.minStay ?? {}
    };
  },
  async fetchBookingDetails(bookingReference: string, guestEmail: string): Promise<BookingDetailsResponse> {
    const params = new URLSearchParams({ email: guestEmail });
    const encodedRef = encodeURIComponent(bookingReference.trim());
    const res = await fetch(`/api/bookings/${encodedRef}?${params.toString()}`);
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? "We couldn't find that booking. Check your 5-character reference and booking email, then try again."
          : "We couldn't load your booking right now. Please try again in a moment.",
      );
    }
    return res.json();
  },
  async fetchTripAccessCodes(bookingReference: string, guestEmail: string): Promise<TripAccessResponse> {
    const params = new URLSearchParams({ email: guestEmail });
    const encodedRef = encodeURIComponent(bookingReference.trim());
    const res = await fetch(`/api/trip-access/${encodedRef}?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to load access codes");
    }
    return res.json();
  },
};
