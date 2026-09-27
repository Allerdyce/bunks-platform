import type { OpsContactProfile } from '@prisma/client';
import { prisma } from './prisma';
import {
  DEFAULT_OPS_DETAILS,
  OPTIONAL_OPS_FIELDS,
  OpsDetails,
  OpsDetailsInput,
  OpsReferenceLink,
  OpsSupportContact,
  REQUIRED_OPS_FIELDS,
} from './opsDetails/config';
import { toAbsoluteUrl } from '@/lib/url';

const sanitizeString = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const sanitizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

// Values written by an early version of prisma/seed.mjs. They are fictional (555 numbers, a
// made-up concierge and property code, links to pages that don't exist), so they must never
// reach a guest: treat them as unset wherever they are read.
const SEED_PLACEHOLDER_VALUES = new Set([
  '+1 (970) 555-0119',
  '+1 (970) 555-0124',
  '+1 (970) 555-0101',
  'ops@bunks.com',
  '07:00–22:00 MT',
  'Priya',
  'Slack #host-support',
  'Add-on escalations',
  'Share property code 8821',
  'Check-in after 16:00',
  'Checkout by 10:00',
]);
const isSeedPlaceholder = (value: unknown) =>
  typeof value === 'string' &&
  (SEED_PLACEHOLDER_VALUES.has(value.trim()) || /bunks\.com\/\?property=[^/]+\//.test(value));

const withoutSeedPlaceholders = <T extends Record<string, unknown>>(values: T, defaults: Record<string, unknown>): T =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, isSeedPlaceholder(value) ? (defaults[key] ?? null) : value]),
  ) as T;

const normalizeRecord = (record?: OpsContactProfile | null): OpsDetails => {
  if (!record) {
    return { ...DEFAULT_OPS_DETAILS };
  }

  const { id, createdAt, updatedAt, ...stored } = record;
  const rest = withoutSeedPlaceholders(stored, DEFAULT_OPS_DETAILS);
  return {
    ...DEFAULT_OPS_DETAILS,
    ...rest,
    id,
    createdAt: createdAt?.toISOString() ?? null,
    updatedAt: updatedAt?.toISOString() ?? null,
  };
};

export function parseOpsDetailsPayload(payload: unknown): OpsDetailsInput {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload. Provide a JSON object.');
  }

  const result: OpsDetailsInput = { ...DEFAULT_OPS_DETAILS };
  const data = payload as Record<string, unknown>;
  const setField = <K extends keyof OpsDetailsInput>(field: K, value: OpsDetailsInput[K]) => {
    result[field] = value;
  };

  for (const field of REQUIRED_OPS_FIELDS) {
    const value = sanitizeString(data[field]);
    // Only the support email is truly required; blank phone lines are omitted from guest emails.
    if (!value && field === 'supportEmail') {
      throw new Error(`Field "${field}" is required.`);
    }
    setField(field, value as OpsDetailsInput[typeof field]);
  }

  for (const field of OPTIONAL_OPS_FIELDS) {
    const normalized = (sanitizeOptionalString(data[field]) ?? null) as OpsDetailsInput[typeof field];
    setField(field, normalized);
  }

  return result;
}

export async function getOpsDetails(propertyId?: number): Promise<OpsDetails> {
  try {
    const record = await prisma.opsContactProfile.findFirst({
      where: { propertyId: propertyId ?? null },
      orderBy: { id: 'asc' },
    });
    return normalizeRecord(record);
  } catch (error) {
    console.error('[opsDetails] Failed to load ops contact profile', error);
    return { ...DEFAULT_OPS_DETAILS };
  }
}

export async function upsertOpsDetails(input: OpsDetailsInput, propertyId?: number): Promise<OpsDetails> {
  try {
    const existing = await prisma.opsContactProfile.findFirst({
      where: { propertyId: propertyId ?? null },
      orderBy: { id: 'asc' },
    });

    if (existing) {
      const updated = await prisma.opsContactProfile.update({
        where: { id: existing.id },
        data: input,
      });
      return normalizeRecord(updated);
    }
    const created = await prisma.opsContactProfile.create({
      data: { ...input, propertyId: propertyId ?? null },
    });
    return normalizeRecord(created);
  } catch (error) {
    console.error('[opsDetails] Failed to persist ops contact profile', error);
    throw new Error('Unable to save ops details. Make sure the latest database migrations have been applied.');
  }
}

const joinParts = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ');

export function buildSupportDirectory(details: OpsDetails): OpsSupportContact[] {
  const directory: OpsSupportContact[] = [];

  if (details.opsEmail || details.opsPhone) {
    directory.push({
      label: 'Ops desk',
      value: joinParts(details.opsEmail, details.opsPhone),
      helper: details.opsDeskHours ?? null,
    });
  }

  if (details.opsDeskPhone && details.opsDeskPhone !== details.opsPhone) {
    directory.push({
      label: 'Dispatch line',
      value: details.opsDeskPhone,
      helper: details.opsDeskHours ?? null,
    });
  }

  if (details.conciergeName || details.conciergeContact) {
    directory.push({
      label: details.conciergeName ?? 'Concierge',
      value: joinParts(details.conciergeContact, details.supportSmsNumber),
      helper: details.conciergeNotes ?? null,
    });
  }

  if (details.emergencyContact) {
    directory.push({
      label: 'Emergency',
      value: details.emergencyContact,
      helper: details.emergencyDetails ?? null,
    });
  }

  return directory.filter((item) => Boolean(item.value));
}

type ReferenceLinkOptions = {
  checkInGuideUrl?: string;
  guestBookUrl?: string;
};

export function buildReferenceLinks(details: OpsDetails, options: ReferenceLinkOptions = {}): OpsReferenceLink[] {
  const links: OpsReferenceLink[] = [];
  const addLink = (label: string, href?: string | null, description?: string) => {
    const absoluteHref = toAbsoluteUrl(href);
    if (!absoluteHref) return;
    if (links.some((link) => link.href === absoluteHref)) return;
    links.push({ label, href: absoluteHref, description });
  };

  addLink('Open live instructions', options.checkInGuideUrl ?? details.liveInstructionsUrl, 'Entry, parking and Wi-Fi details.');
  addLink('Door codes & arrival notes', details.doorCodesDocUrl, 'Your entry codes and arrival notes.');
  addLink('Arrival overview', details.arrivalNotesUrl, 'Directions and parking.');
  addLink('Browse recommendations', details.recommendationsUrl, 'Food, adventure, and family-friendly picks.');
  addLink('Open the guest book', options.guestBookUrl ?? details.guestBookUrl, 'FAQs, itineraries, and local intel.');

  return links;
}
