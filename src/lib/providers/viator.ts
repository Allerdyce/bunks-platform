import type { ProviderReservationInput, ProviderReservationResult } from './providerTypes';
import { ProviderConfigurationError, ProviderReservationError } from './providerTypes';

const VIATOR_API_KEY = process.env.VIATOR_API_KEY;
const VIATOR_BOOKING_BASE_URL =
  process.env.VIATOR_BOOKING_BASE_URL ?? 'https://api.partner.viator.com/service/';

const DEFAULT_BOOKING_ENDPOINT = 'booking/v1/bookings';

interface ViatorBookingResponse {
  bookingId?: string;
  bookingReference?: string;
  status?: string;
  confirmationNumber?: string;
  [key: string]: unknown;
}

function requireViatorConfiguration() {
  if (!VIATOR_API_KEY) {
    throw new ProviderConfigurationError('VIATOR_API_KEY is not configured.');
  }
}

function toTravelDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function splitGuestName(fullName: string) {
  const [firstName, ...rest] = fullName.trim().split(' ');
  const lastName = rest.length ? rest.join(' ') : 'Guest';
  return { firstName: firstName || 'Guest', lastName };
}

async function postViator<TResponse>(path: string, body: unknown): Promise<TResponse> {
  requireViatorConfiguration();

  const url = new URL(path, VIATOR_BOOKING_BASE_URL).toString();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': VIATOR_API_KEY as string,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new ProviderReservationError(
      `Viator booking failed (${response.status}): ${errorBody ?? 'Unknown error'}`,
    );
  }

  return (await response.json()) as TResponse;
}

export async function reserveViatorExperience(
  input: ProviderReservationInput,
): Promise<ProviderReservationResult> {
  if (!input.providerProductId) {
    throw new ProviderReservationError('Viator add-ons require a providerProductId.');
  }

  if (!VIATOR_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new ProviderConfigurationError('VIATOR_API_KEY is not configured.');
    }

    console.warn('[providers] Missing VIATOR_API_KEY; returning mock confirmation.');
    return {
      addonId: input.addonId,
      provider: 'viator',
      confirmationCode: `VIATOR-MOCK-${Date.now()}`,
      status: 'pending-api-key',
    };
  }

  const { firstName, lastName } = splitGuestName(input.guestName);

  const travelDateSource = input.activityDate ?? input.checkInDate;

  const payload = {
    productCode: input.providerProductId,
    travelDate: toTravelDate(travelDateSource),
    currency: 'USD',
    language: 'en',
    travelers: [
      {
        firstName,
        lastName,
        email: input.guestEmail,
        travelerType: 'ADULT',
        leadTraveler: true,
        homeCountry: 'US',
      },
    ],
    unitItems: [
      {
        productCode: input.providerProductId,
        quantity: Math.max(1, input.partySize),
      },
    ],
  };

  const bookingResponse = await postViator<ViatorBookingResponse>(DEFAULT_BOOKING_ENDPOINT, payload);

  const confirmationCode =
    bookingResponse.bookingReference || bookingResponse.bookingId || bookingResponse.confirmationNumber;

  if (!confirmationCode) {
    throw new ProviderReservationError('Viator booking response did not include a confirmation code.');
  }

  return {
    addonId: input.addonId,
    provider: 'viator',
    confirmationCode,
    status: (bookingResponse.status as string) ?? 'confirmed',
    rawResponse: bookingResponse,
  };
}
