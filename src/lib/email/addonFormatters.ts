import type { Addon, BookingAddon, Prisma } from '@prisma/client';
import { formatCurrencyFromCents, formatDateForEmail } from '@/lib/email/helpers';

export type BookingAddonWithDetails = BookingAddon & { addon: Addon };

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
});

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  'pending-provider': 'Pending provider confirmation',
  'pending-api-key': 'Awaiting API setup',
  failed: 'Could not be confirmed',
  cancelled: 'Cancelled',
};

function formatTimeSlot(timeSlot?: string | null) {
  if (!timeSlot) return undefined;
  const [hourStr, minuteStr] = timeSlot.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return timeSlot;
  }

  const reference = new Date(Date.UTC(2020, 0, 1, hour, minute));
  return timeFormatter.format(reference);
}

function formatStatusLabel(status?: string | null) {
  if (!status) return undefined;
  return STATUS_LABELS[status] ?? status.replace(/-/g, ' ');
}

function extractInstruction(metadata?: Prisma.JsonValue | null): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  const record = metadata as Record<string, unknown>;

  if (typeof record.meetingLocation === 'string' && record.meetingLocation.trim()) {
    return record.meetingLocation.trim();
  }
  if (typeof record.meetingInstructions === 'string' && record.meetingInstructions.trim()) {
    return record.meetingInstructions.trim();
  }
  if (typeof record.notes === 'string' && record.notes.trim()) {
    return record.notes.trim();
  }
  if (typeof record.description === 'string' && record.description.trim()) {
    return record.description.trim();
  }

  return undefined;
}

export interface EmailAddonSummary {
  id: number;
  name: string;
  priceLabel: string;
  scheduleLabel?: string;
  statusLabel?: string;
  confirmationLabel?: string;
  instruction?: string;
}

function buildScheduleLabel(addon: BookingAddonWithDetails) {
  const parts: string[] = [];
  if (addon.activityDate) {
    parts.push(formatDateForEmail(new Date(addon.activityDate)));
  }
  const timeLabel = formatTimeSlot(addon.activityTimeSlot);
  if (timeLabel) {
    parts.push(timeLabel);
  }
  return parts.join(' · ') || undefined;
}

export function buildEmailAddonSummaries(addons: BookingAddonWithDetails[]): EmailAddonSummary[] {
  return addons.map((addon) => {
    const scheduleLabel = buildScheduleLabel(addon);
    const statusLabel = formatStatusLabel(addon.providerStatus);
    const confirmationLabel = addon.providerConfirmationCode
      ? `Confirmation ${addon.providerConfirmationCode}`
      : undefined;

    return {
      id: addon.id,
      name: addon.addon.title,
      priceLabel: formatCurrencyFromCents(addon.finalPriceCents, addon.addon.currency ?? undefined),
      scheduleLabel,
      statusLabel,
      confirmationLabel,
      instruction: extractInstruction(addon.providerMetadata),
    };
  });
}
