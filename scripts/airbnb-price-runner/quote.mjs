import { randomBytes } from 'node:crypto';

export const BOOKIT_HASH = '45cc0ada54da798665ac40417178a67be1378ca94275d37a2eca61ac1fb2cf7d';
export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

// Strict USD display strings only. Never infer currency or round a numeric float.
export function usdCents(value) {
  if (typeof value !== 'string' || !/^\$(?:0|[1-9]\d{0,2}(?:,\d{3})*|[1-9]\d*)(?:\.\d{2})?$/.test(value)) return null;
  const [whole, fraction = '00'] = value.slice(1).replaceAll(',', '').split('.');
  const cents = Number(whole) * 100 + Number(fraction);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function failedQuote(scenario, status, error, httpStatus = null) {
  return { scenarioId: scenario.scenarioId, status, currency: 'USD', feesIncluded: false,
    priceLabel: null, nightsLine: null, cancellation: null, unavailableReason: null, error, httpStatus };
}

function text(value) {
  if (typeof value === 'string') return value;
  if (typeof value?.title === 'string') return value.title;
  return null;
}

export function parseQuote(payload, scenario, httpStatus = 200) {
  const fail = (message) => failedQuote(scenario, 'error', message, httpStatus);
  if (Array.isArray(payload?.errors) && payload.errors.length) return fail('Airbnb returned GraphQL errors.');
  const bookIt = payload?.data?.node?.pdpPresentation?.bookIt;
  if (!bookIt) return fail('Airbnb response is missing bookIt.');
  const display = bookIt.structuredDisplayPrice;
  const groups = [bookIt.productItemDetail?.explanationData?.priceDetails, display?.explanationData?.priceDetails];
  const items = groups.flatMap((group) => Array.isArray(group)
    ? group.flatMap((line) => Array.isArray(line?.items) ? line.items : []) : []);
  const nights = items.find((line) => /^\d+ nights?\s*[x×]\s*\$/.test(line?.description ?? ''));
  const result = { ...failedQuote(scenario, 'error', null, httpStatus),
    feesIncluded: text(bookIt.announcement)?.trim() === 'Prices include all fees',
    priceLabel: text(display?.primaryLine?.accessibilityLabel),
    nightsLine: text(nights?.description), cancellation: text(bookIt.availabilityDetailsKicker) };
  if (bookIt.availability?.isAvailable === false) {
    return { ...result, status: 'unavailable', unavailableReason: text(bookIt.availability.unavailabilityMessage) };
  }
  if (bookIt.availability?.isAvailable !== true) return fail('Airbnb response is missing explicit availability.');
  const discount = items.find((line) => line?.description === 'Price after discount');
  const price = discount ? discount.priceString : nights ? nights.priceString : display?.primaryLine?.price;
  const totalCents = usdCents(price);
  if (totalCents === null) return fail('Airbnb price is missing or is not a positive USD amount.');
  return { ...result, status: 'ok', totalCents };
}

function decodeEntities(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|quot|apos|amp|lt|gt);/gi, (entity, name) => {
    if (name.startsWith('#')) {
      const code = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    }
    return { quot: '"', apos: "'", amp: '&', lt: '<', gt: '>' }[name.toLowerCase()];
  });
}

export function extractApiKey(html) {
  const script = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .find((match) => /\bid\s*=\s*(["'])data-initializer-bootstrap\1/i.test(match[1]));
  if (!script) throw new Error('Listing page is missing data-initializer-bootstrap.');
  // Raw JSON first: decoding valid JSON can corrupt literal entities within strings.
  for (const candidate of [script[2], decodeEntities(script[2])]) {
    try {
      const key = JSON.parse(candidate)?.['layout-init']?.api_config?.key;
      if (typeof key === 'string' && /^[a-zA-Z0-9_-]+$/.test(key)) return key;
    } catch { /* Try the entity-decoded form. */ }
  }
  throw new Error('Listing page contains no usable public API key.');
}

export function quoteUrl(scenario, { hash = BOOKIT_HASH, currency = 'USD', locale = 'en' } = {}) {
  const dateRange = { startDate: scenario.checkIn, endDate: scenario.checkOut };
  const variables = {
    id: Buffer.from(`DemandStayListing:${scenario.listingId}`).toString('base64'),
    dateRange,
    guestCounts: { numberOfAdults: scenario.adults, ...(scenario.pets > 0 ? { numberOfPets: scenario.pets } : {}) },
    includePdpMigrationBookItCalendarSheetFragment: true,
    includePdpMigrationBookItFloatingFooterFragment: true,
    includePdpMigrationBookItNavFragment: true,
    includePdpMigrationBookItSidebarFragment: true,
    includeOverviewMerchandisingTipsFragment: true,
    includeStaysPdpPriceHeatmapFragment: false,
    priceHeatmapDateRange: dateRange,
    p3ImpressionId: `p3_${Math.floor(Date.now() / 1000)}_${randomBytes(8).toString('hex')}`,
    selectedCancellationPolicyId: null, causeId: null, selectedGuestOptionId: null,
  };
  const url = new URL(`https://www.airbnb.com/api/v3/StaysPdpBookItQuery/${hash}`);
  url.search = new URLSearchParams({ operationName: 'StaysPdpBookItQuery', currency, locale,
    variables: JSON.stringify(variables),
    extensions: JSON.stringify({ persistedQuery: { version: 1, sha256Hash: hash } }) }).toString();
  return url;
}
