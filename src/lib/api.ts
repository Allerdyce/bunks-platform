import type {
  AvailabilityResponse,
  BookingConversationResponse,
  BookingDetailsResponse,
  BookingRequest,
  BookingResponse,
  ConversationMessage,
  Property,
} from "@/types";

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));



export type BookingConversationCredentials = {
  guestEmail: string;
  bookingReference: string;
};

export type SendBookingMessageInput = {
  body: string;
  guestEmail?: string;
  bookingReference?: string;
};

const mockApi = {
  async checkAvailability(
    slug: Property["slug"],
    checkIn: string,
    checkOut: string,
  ): Promise<AvailabilityResponse> {
    await delay(500);
    void slug;
    void checkIn;
    void checkOut;
    return { available: true };
  },
  async createBooking(booking: BookingRequest): Promise<BookingResponse> {
    await delay(1000);
    void booking;
    return {
      ok: true,
      bookingId: 999999,
      bookingReference: "MOCK-1A2B-3C4D-5E6F",
      clientSecret: "pi_mock_secret_12345",
      totalPriceCents: 0,
      currency: "usd",
      nights: 0,
      breakdown: {
        nightlySubtotalCents: 0,
        cleaningFeeCents: 0,
        serviceFeeCents: 0,
        nightlyLineItems: [],
      },
    };
  },
  async fetchBookingDetails(bookingReference: string, guestEmail: string): Promise<BookingDetailsResponse> {
    await delay(400);
    return {
      booking: {
        id: 999999,
        referenceCode: bookingReference,
        status: "PENDING",
        checkInDate: new Date().toISOString(),
        checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        guestName: "Mock Guest",
        guestEmail,
        totalPriceCents: 0,
        property: {
          id: 1,
          name: "Mock Property",
          slug: "mock-property",
          timezone: "America/Los_Angeles",
          checkInGuideUrl: null,
          guestBookUrl: null,
          hostSupportEmail: null,
        },

      },
    };
  },
  async fetchBlockedDates(slug: Property["slug"]): Promise<string[]> {
    await delay(300);
    void slug;
    const today = new Date();
    const blocked: string[] = [];
    [5, 6, 20, 21, 22].forEach((offset) => {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      blocked.push(d.toISOString());
    });
    return blocked;
  },

  async fetchBookingConversation(
    bookingId: number,
    credentials?: BookingConversationCredentials,
  ): Promise<BookingConversationResponse> {
    const params = new URLSearchParams();
    if (credentials?.guestEmail) {
      params.set("guestEmail", credentials.guestEmail);
    }
    if (credentials?.bookingReference) {
      params.set("bookingReference", credentials.bookingReference);
    }

    const query = params.toString();
    const url = query ? `/api/bookings/${bookingId}/conversation?${query}` : `/api/bookings/${bookingId}/conversation`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || "Failed to load conversation");
    }

    return res.json();
  },
  async sendBookingMessage(
    bookingId: number,
    payload: SendBookingMessageInput,
  ): Promise<ConversationMessage> {
    const res = await fetch(`/api/bookings/${bookingId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const data = text ? (JSON.parse(text) as unknown) : null;

    if (!res.ok) {
      const errorMessage = ((data as { error?: string } | null)?.error ?? text) || "Failed to send message";
      throw new Error(typeof errorMessage === "string" ? errorMessage : "Failed to send message");
    }

    if (!data) {
      throw new Error("Empty response from messaging API");
    }

    return data as ConversationMessage;
  },
};

const realApi = {
  async checkAvailability(
    slug: Property["slug"],
    checkIn: string,
    checkOut: string,
  ): Promise<AvailabilityResponse> {
    const res = await fetch(`/api/properties/${slug}/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkIn, checkOut }),
    });

    if (!res.ok) {
      throw new Error("Failed to check availability");
    }

    return res.json();
  },
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
  async fetchBlockedDates(slug: Property["slug"]): Promise<string[]> {
    const res = await fetch(`/api/properties/${slug}/blocked-dates`);
    if (!res.ok) {
      throw new Error("Failed to fetch blocked dates");
    }
    const data = await res.json();
    return data.blockedDates?.map((entry: { date: string }) => entry.date) ?? [];
  },

  async fetchBookingConversation(
    bookingId: number,
    credentials?: BookingConversationCredentials,
  ): Promise<BookingConversationResponse> {
    const params = new URLSearchParams();
    if (credentials?.guestEmail) {
      params.set("guestEmail", credentials.guestEmail);
    }
    if (credentials?.bookingReference) {
      params.set("bookingReference", credentials.bookingReference);
    }

    const query = params.toString();
    const url = query ? `/api/bookings/${bookingId}/conversation?${query}` : `/api/bookings/${bookingId}/conversation`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || "Failed to load conversation");
    }

    return res.json();
  },
  async sendBookingMessage(
    bookingId: number,
    payload: SendBookingMessageInput,
  ): Promise<ConversationMessage> {
    const res = await fetch(`/api/bookings/${bookingId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const data = text ? (JSON.parse(text) as unknown) : null;

    if (!res.ok) {
      const errorMessage = ((data as { error?: string } | null)?.error ?? text) || "Failed to send message";
      throw new Error(typeof errorMessage === "string" ? errorMessage : "Failed to send message");
    }

    if (!data) {
      throw new Error("Empty response from messaging API");
    }

    return data as ConversationMessage;
  },
  async fetchBookingDetails(bookingReference: string, guestEmail: string): Promise<BookingDetailsResponse> {
    const params = new URLSearchParams({ email: guestEmail });
    const encodedRef = encodeURIComponent(bookingReference.trim());
    const res = await fetch(`/api/bookings/${encodedRef}?${params.toString()}`);
    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || "Failed to load booking details");
    }
    return res.json();
  },
};

export const api = USE_MOCK_API ? mockApi : realApi;
export { USE_MOCK_API };
