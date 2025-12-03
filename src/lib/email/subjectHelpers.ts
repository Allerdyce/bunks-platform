import { getEmailSubject } from '@/lib/email/subjects';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function getNestedValue(source: UnknownRecord, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (!isRecord(acc)) return undefined;
    return acc[key];
  }, source);
}

export function humanizeSlug(slug: string) {
  return slug
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function resolveToken(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return fallback;
}

export function renderSubjectWithSample(slug: string, sampleProps: unknown): string {
  const template = getEmailSubject(slug);
  const fallback = humanizeSlug(slug);
  if (!template) {
    return fallback;
  }

  if (!isRecord(sampleProps)) {
    return fallback;
  }

  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, rawToken) => {
    const token = String(rawToken).trim();
    const value = getNestedValue(sampleProps, token);
    return resolveToken(value, fallback);
  });
}

export function buildSampleSubject(slug: string, sampleProps: unknown): string {
  const rendered = renderSubjectWithSample(slug, sampleProps);
  return `[Sample] ${rendered}`;
}
