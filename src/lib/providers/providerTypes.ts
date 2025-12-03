export type SupportedProvider = 'custom' | 'viator' | 'gyg';

export interface ProviderReservationInput {
  addonId: number;
  addonSlug: string;
  provider: SupportedProvider;
  providerProductId?: string | null;
  checkInDate: Date;
  checkOutDate: Date;
  activityDate?: Date;
  activityTimeSlot?: string | null;
  guestName: string;
  guestEmail: string;
  partySize: number;
}

export interface ProviderReservationResult {
  addonId: number;
  provider: SupportedProvider;
  confirmationCode: string;
  status: string;
  rawResponse?: unknown;
}

export class ProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderConfigurationError';
  }
}

export class ProviderReservationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderReservationError';
  }
}
