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

const normalizeRecord = (record?: OpsContactProfile | null): OpsDetails => {
  if (!record) {
    return { ...DEFAULT_OPS_DETAILS };
  }

  const { id, createdAt, updatedAt, ...rest } = record;
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
    if (!value) {
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

  addLink('Open live instructions', options.checkInGuideUrl ?? details.liveInstructionsUrl, 'Smart lock, parking, and Wi-Fi details.');
  addLink('Door codes & arrival notes', details.doorCodesDocUrl, 'Always-current smart lock codes and arrival notes.');
  addLink('Arrival overview', details.arrivalNotesUrl, 'Route tips, parking plans, and contingency steps.');
  addLink('Browse recommendations', details.recommendationsUrl, 'Food, adventure, and family-friendly picks.');
  addLink('Open the guest book', options.guestBookUrl ?? details.guestBookUrl, 'FAQs, itineraries, and local intel.');

  return links;
}
