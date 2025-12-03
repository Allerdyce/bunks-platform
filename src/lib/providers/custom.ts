import type { ProviderReservationInput, ProviderReservationResult } from './providerTypes';

export async function reserveCustomExperience(
  input: ProviderReservationInput,
): Promise<ProviderReservationResult> {
  const confirmationCode = `CUSTOM-${input.addonSlug}-${Date.now()}`;

  console.info('[providers] Simulating custom add-on reservation', {
    addonId: input.addonId,
    addonSlug: input.addonSlug,
    checkInDate: input.checkInDate.toISOString(),
    activityDate: input.activityDate?.toISOString(),
    activityTimeSlot: input.activityTimeSlot,
  });

  return {
    addonId: input.addonId,
    provider: 'custom',
    confirmationCode,
    status: 'pending-concierge-followup',
    rawResponse: {
      note: 'Custom provider integrations route to internal concierge. This is a simulated confirmation code.',
    },
  };
}
