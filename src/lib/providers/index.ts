import type { ProviderReservationInput, ProviderReservationResult } from './providerTypes';
import { reserveViatorExperience } from './viator';
import { reserveCustomExperience } from './custom';

export type { ProviderReservationInput, ProviderReservationResult } from './providerTypes';
export { ProviderConfigurationError, ProviderReservationError } from './providerTypes';

export async function reserveAddonWithProvider(
  input: ProviderReservationInput,
): Promise<ProviderReservationResult | null> {
  switch (input.provider) {
    case 'viator':
      return reserveViatorExperience(input);
    case 'custom':
      return reserveCustomExperience(input);
    case 'gyg':
      console.warn('[providers] GetYourGuide integration not implemented; skipping reservation.');
      return {
        addonId: input.addonId,
        provider: 'gyg',
        confirmationCode: `GYG-PENDING-${Date.now()}`,
        status: 'not-implemented',
      };
    default:
      console.warn('[providers] Unknown provider type; skipping reservation.', input.provider);
      return null;
  }
}
