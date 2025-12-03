const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://bunks.com').replace(/\/+$/, '');

function hasProtocol(url: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(url);
}

export function toAbsoluteUrl(url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return undefined;
  }

  if (hasProtocol(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  try {
    const needsPrefix = trimmed.startsWith('/') || trimmed.startsWith('?') || trimmed.startsWith('#');
    const candidate = needsPrefix ? trimmed : `/${trimmed}`;
    const resolved = new URL(candidate, `${APP_BASE_URL}/`);
    resolved.pathname = resolved.pathname.replace(/\/{2,}/g, '/');
    return resolved.toString();
  } catch {
    const cleaned = trimmed
      .replace(/^\/+/, '')
      .replace(/\/{2,}/g, '/');
    return `${APP_BASE_URL}/${cleaned}`;
  }
}

export function getAppBaseUrl() {
  return APP_BASE_URL;
}
