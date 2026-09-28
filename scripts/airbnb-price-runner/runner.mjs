import { setTimeout as sleep } from 'node:timers/promises';
import { BOOKIT_HASH, USER_AGENT, extractApiKey, failedQuote, parseQuote, quoteUrl } from './quote.mjs';

const MAX_REQUESTS = 40;
const MAX_BACKOFF_MS = 60_000;
const AIRBNB_BUDGET_MS = 10 * 60_000;

export function validateScenarios(body) {
  if (!body || typeof body.runId !== 'string' || !body.runId.trim() || body.currency !== 'USD'
    || body.locale !== 'en' || !Array.isArray(body.scenarios)) throw new Error('Invalid scenarios contract (requires runId, USD, en, scenarios).');
  const ids = new Set();
  const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  for (const s of body.scenarios) {
    if (!s || typeof s.scenarioId !== 'string' || !s.scenarioId.trim() || ids.has(s.scenarioId)
      || typeof s.listingId !== 'string' || !/^[1-9]\d*$/.test(s.listingId)
      || !validDate(s.checkIn) || !validDate(s.checkOut) || s.checkOut <= s.checkIn
      || !Number.isSafeInteger(s.adults) || s.adults < 1
      || (s.pets !== undefined && (!Number.isSafeInteger(s.pets) || s.pets < 0))) {
      throw new Error('Invalid or duplicate scenario; refusing to guess dates, listing IDs, or guests.');
    }
    ids.add(s.scenarioId);
  }
  return body;
}

export function retryAfterMs(value, now = Date.now()) {
  if (!value) return 0;
  if (/^\d+$/.test(value.trim())) return Number(value) * 1000;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : 0;
}

export function isChallenge(body) {
  // Only challenge HTML, not bootstrap JavaScript mentioning CAPTCHA settings.
  if (!/^\s*</.test(body)) return false;
  if (/\/cdn-cgi\/challenge-platform\//i.test(body)) return true;
  const visible = body.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '').replace(/<[^>]*>/g, ' ');
  return /captcha|(?:verify|confirm) (?:that )?you(?:'re| are) human|access denied|robot check|pardon our interruption|security check|akamai bot/i.test(visible);
}

export function createAirbnbClient({ fetchFn = fetch, sleepFn = sleep, now = Date.now, random = Math.random,
  timeoutMs = 15_000 } = {}) {
  let count = 0, nextAllowedAt = 0, stopped = null;
  const deadline = now() + AIRBNB_BUDGET_MS;
  return {
    get count() { return count; },
    async get(url, headers = {}) {
      if (stopped) return { ...stopped, skipped: true };
      for (let attempt = 0; attempt < 2; attempt++) {
        if (Math.max(now(), nextAllowedAt) + timeoutMs > deadline) {
          stopped = { status: 'error', error: 'Airbnb time budget reached; stopping to report results before the workflow timeout.', httpStatus: null };
          return { ...stopped, skipped: true };
        }
        if (count >= MAX_REQUESTS) {
          stopped = { status: 'error', error: '40-request Airbnb limit reached; remaining requests skipped.', httpStatus: null };
          return { ...stopped, skipped: true };
        }
        await sleepFn(Math.max(0, nextAllowedAt - now()));
        count++;
        let response;
        try {
          response = await fetchText(fetchFn, url, { headers: { 'User-Agent': USER_AGENT,
            'Accept-Language': 'en-US', ...headers } }, timeoutMs);
        } catch {
          nextAllowedAt = now() + 2000 + Math.floor(random() * 2001);
          if (attempt === 0) continue;
          return { status: 'error', error: 'Airbnb network request failed or timed out after one retry.', httpStatus: null };
        }
        const backoff = retryAfterMs(response.headers.get('retry-after'), now());
        nextAllowedAt = now() + Math.max(2000 + Math.floor(random() * 2001), backoff);
        const { httpStatus, body } = response;
        if ([401, 403, 429].includes(httpStatus) || isChallenge(body)) {
          stopped = { status: 'blocked', error: `Airbnb denied access or returned a bot challenge (HTTP ${httpStatus}); remaining Airbnb requests skipped.`, httpStatus };
          return stopped;
        }
        if (backoff > MAX_BACKOFF_MS) {
          stopped = { status: 'blocked', error: 'Airbnb requested more than 60 seconds of backoff; stopping this run without retrying early.', httpStatus };
          return stopped;
        }
        if (httpStatus >= 500 && attempt === 0) continue;
        if (httpStatus < 200 || httpStatus >= 300) return { status: 'error', error: `Airbnb returned HTTP ${httpStatus}.`, httpStatus };
        return { status: 'ok', body, httpStatus };
      }
    },
  };
}

async function fetchText(fetchFn, url, options = {}, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Never forward Bunks' bearer token to a redirect destination. Airbnb redirects also fail closed.
    const response = await fetchFn(url, { ...options, redirect: 'manual', signal: controller.signal });
    const body = await response.text();
    return { httpStatus: response.status, headers: response.headers, body };
  } finally { clearTimeout(timer); }
}

export async function run({ env = process.env, dryRun = false, fetchFn = fetch, sleepFn = sleep,
  now = Date.now, random = Math.random, log = console.log } = {}) {
  const { BUNKS_BASE_URL: base, PRICE_CHECK_SECRET: secret } = env;
  let origin;
  try {
    origin = new URL(base);
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash
      || origin.pathname !== '/') throw new Error();
  } catch { throw new Error('BUNKS_BASE_URL must be an HTTPS origin without credentials, path, query, or fragment.'); }
  if (!secret?.trim() || /[\r\n]/.test(secret)) throw new Error('PRICE_CHECK_SECRET is required and must be a single-line token.');
  const auth = { Authorization: `Bearer ${secret}` };
  let scenariosResponse;
  try { scenariosResponse = await fetchText(fetchFn, new URL('/api/price-check/scenarios', origin), { headers: auth }); }
  catch { throw new Error('Could not fetch Bunks scenarios (network failure or timeout).'); }
  if (scenariosResponse.httpStatus !== 200) throw new Error(`Bunks scenarios returned HTTP ${scenariosResponse.httpStatus}.`);
  let data;
  try { data = validateScenarios(JSON.parse(scenariosResponse.body)); }
  catch { throw new Error('Bunks scenarios response is invalid; expected unique scenarios with valid dates, USD and en.'); }

  const hash = env.AIRBNB_BOOKIT_HASH || BOOKIT_HASH;
  const hashValid = /^[a-f0-9]{64}$/.test(hash);
  if (dryRun) {
    if (!hashValid) throw new Error('AIRBNB_BOOKIT_HASH must contain 64 lowercase hexadecimal characters.');
    log(JSON.stringify({ dryRun: true, runId: data.runId, bookItHash: hash, maxAirbnbRequests: MAX_REQUESTS,
      bootstrap: env.AIRBNB_API_KEY || !data.scenarios.length ? 'not needed' : `https://www.airbnb.com/rooms/${data.scenarios[0].listingId}`,
      requests: data.scenarios.map((s) => ({ scenarioId: s.scenarioId, method: 'GET', url: quoteUrl(s, { hash }).toString() })) }, null, 2));
    return { dryRun: true };
  }

  const client = createAirbnbClient({ fetchFn, sleepFn, now, random });
  const quotes = [];
  let apiKey = env.AIRBNB_API_KEY;
  let setupFailure = !hashValid ? { status: 'error', error: 'AIRBNB_BOOKIT_HASH must contain 64 lowercase hexadecimal characters.', httpStatus: null } : null;
  if (apiKey && !/^[a-zA-Z0-9_-]+$/.test(apiKey)) setupFailure = { status: 'error', error: 'AIRBNB_API_KEY has an invalid format.', httpStatus: null };
  if (!setupFailure && !apiKey && data.scenarios.length) {
    const bootstrap = await client.get(`https://www.airbnb.com/rooms/${data.scenarios[0].listingId}`);
    if (bootstrap.status !== 'ok') setupFailure = bootstrap;
    else {
      try { apiKey = extractApiKey(bootstrap.body); }
      catch { setupFailure = { status: 'error', error: 'Could not extract the public web app key from the listing page.', httpStatus: bootstrap.httpStatus }; }
    }
  }
  for (const scenario of data.scenarios) {
    if (setupFailure) {
      quotes.push(failedQuote(scenario, setupFailure.status, setupFailure.error, null));
      continue;
    }
    try {
      const response = await client.get(quoteUrl(scenario, { hash }), {
        'X-Airbnb-API-Key': apiKey, 'X-Airbnb-GraphQL-Platform': 'web',
        'X-Airbnb-GraphQL-Platform-Client': 'minimalist-niobe',
      });
      if (response.status !== 'ok') {
        quotes.push(failedQuote(scenario, response.status, response.error, response.skipped ? null : response.httpStatus));
        continue;
      }
      let payload;
      try { payload = JSON.parse(response.body); }
      catch {
        quotes.push(failedQuote(scenario, 'error', 'Airbnb returned a non-JSON response.', response.httpStatus));
        continue;
      }
      quotes.push(parseQuote(payload, scenario, response.httpStatus));
    } catch {
      quotes.push(failedQuote(scenario, 'error', 'Unexpected error while collecting the Airbnb quote.'));
    }
  }
  const result = { runId: data.runId, capturedAt: new Date(now()).toISOString(),
    runner: { bookItHash: hash, version: env.GITHUB_SHA || '1.0.0' }, quotes };
  let posted;
  try {
    posted = await fetchText(fetchFn, new URL('/api/price-check/results', origin), {
      method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(result),
    });
  } catch { throw new Error('Could not post results to Bunks (network failure or timeout).'); }
  if (posted.httpStatus < 200 || posted.httpStatus >= 300) throw new Error(`Bunks results returned HTTP ${posted.httpStatus}.`);
  const counts = Object.fromEntries(['ok', 'unavailable', 'error', 'blocked'].map((status) => [status, quotes.filter((q) => q.status === status).length]));
  log(JSON.stringify({ reported: quotes.length, airbnbRequests: client.count, statuses: counts }));
  return result;
}
