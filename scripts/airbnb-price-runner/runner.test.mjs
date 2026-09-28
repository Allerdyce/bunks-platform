import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createAirbnbClient, isChallenge, retryAfterMs, run, validateScenarios } from './runner.mjs';

const fixtures = JSON.parse(await readFile(new URL('./fixtures/verified-quotes.json', import.meta.url), 'utf8'));
const env = { BUNKS_BASE_URL: 'https://bunks.example', PRICE_CHECK_SECRET: 'test-only-token', GITHUB_SHA: 'test-sha' };
const scenario = { scenarioId: 's1', listingId: '1552191060469626901', checkIn: '2026-11-10', checkOut: '2026-11-13', adults: 2, pets: 0 };
const contract = (count = 2) => ({ runId: 'test-run', currency: 'USD', locale: 'en', scenarios: Array.from({ length: count }, (_, i) => ({ ...scenario, scenarioId: `s${i}` })) });
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers });
const bootstrap = '<html><script id="data-initializer-bootstrap">{"disable_google_recaptcha":true,"layout-init":{"api_config":{"key":"test-public-key"}}}</script></html>';

function harness({ data = contract(), airbnb = () => json(fixtures[0].response), page = () => new Response(bootstrap), post = () => json({ accepted: true }), scenarios = null } = {}) {
  let time = Date.parse('2026-09-27T20:00:00Z');
  const requests = [], sleeps = [], logs = [];
  const fetchFn = async (input, options) => {
    const url = new URL(input);
    requests.push({ url, options });
    if (url.origin === 'https://bunks.example') {
      assert.equal(options.headers.Authorization, `Bearer ${env.PRICE_CHECK_SECRET}`);
      assert.equal(options.redirect, 'manual');
      if (url.pathname.endsWith('/scenarios')) return scenarios ? scenarios() : json(data);
      assert.equal(options.method, 'POST');
      return post();
    }
    assert.equal(url.origin, 'https://www.airbnb.com');
    assert.equal(options.headers.Authorization, undefined);
    if (url.pathname.startsWith('/rooms/')) return page();
    assert.equal(options.headers['X-Airbnb-API-Key'], 'test-public-key');
    return airbnb();
  };
  return { requests, sleeps, logs, options: { env, fetchFn, now: () => time, random: () => 0.5,
    sleepFn: async (ms) => { sleeps.push(ms); time += ms; }, log: (line) => logs.push(line) } };
}

test('full offline run discovers key once, serializes requests and reports expected contract', async () => {
  const h = harness();
  const result = await run(h.options);
  assert.equal(h.requests.filter((r) => r.url.pathname.startsWith('/rooms/')).length, 1);
  assert.deepEqual(result.quotes.map((q) => q.totalCents), [145000, 145000]);
  assert.equal(result.runner.version, 'test-sha');
  assert.equal(result.runId, 'test-run');
  assert.match(result.capturedAt, /Z$/);
  assert.deepEqual(h.sleeps, [0, 3000, 3000]);
  assert.deepEqual(JSON.parse(h.requests.at(-1).options.body), result);
  assert.ok(h.logs.every((s) => !s.includes(env.PRICE_CHECK_SECRET) && !s.includes('test-public-key')));
});

for (const status of [401, 403, 429]) {
  test(`HTTP ${status} blocks remaining Airbnb requests and still posts`, async () => {
    const h = harness({ airbnb: () => json({}, status) });
    const result = await run(h.options);
    assert.deepEqual(result.quotes.map((q) => q.status), ['blocked', 'blocked']);
    assert.equal(result.quotes[0].httpStatus, status);
    assert.equal(result.quotes[1].httpStatus, null);
    assert.equal(h.requests.filter((r) => r.url.pathname.startsWith('/api/v3')).length, 1);
    assert.equal(h.requests.at(-1).options.method, 'POST');
  });
}

test('HTTP 200 bot challenge blocks all remaining calls', async () => {
  const h = harness({ airbnb: () => new Response('<html><h1>Verify you are human</h1></html>') });
  const result = await run(h.options);
  assert.deepEqual(result.quotes.map((q) => q.status), ['blocked', 'blocked']);
});

test('bootstrap challenge still posts a blocked result for every scenario', async () => {
  const h = harness({ page: () => new Response('<html>Access Denied</html>', { status: 403 }) });
  const result = await run(h.options);
  assert.ok(result.quotes.every((q) => q.status === 'blocked' && q.httpStatus === null));
  assert.equal(h.requests.length, 3);
});

test('missing bootstrap key still posts errors', async () => {
  const h = harness({ page: () => new Response('<html>No bootstrap</html>') });
  assert.ok((await run(h.options)).quotes.every((q) => q.status === 'error'));
  assert.equal(h.requests.at(-1).options.method, 'POST');
});

test('all GraphQL errors are reported without failing delivery', async () => {
  const h = harness({ airbnb: () => json({ errors: [{ message: 'query not found' }] }) });
  assert.ok((await run(h.options)).quotes.every((q) => q.status === 'error'));
  assert.equal(h.requests.at(-1).options.method, 'POST');
});

test('key/hash overrides skip bootstrap and are not logged', async () => {
  const h = harness();
  const hash = 'a'.repeat(64);
  const result = await run({ ...h.options, env: { ...env, AIRBNB_API_KEY: 'test-public-key', AIRBNB_BOOKIT_HASH: hash } });
  assert.equal(h.requests.filter((r) => r.url.pathname.startsWith('/rooms/')).length, 0);
  assert.equal(result.runner.bookItHash, hash);
  assert.ok(h.requests.filter((r) => r.url.origin.includes('airbnb')).every((r) => r.url.pathname.endsWith(hash)));
});

test('invalid override reports errors instead of abandoning an acquired run', async () => {
  const h = harness();
  const result = await run({ ...h.options, env: { ...env, AIRBNB_BOOKIT_HASH: 'invalid' } });
  assert.ok(result.quotes.every((q) => q.status === 'error'));
  assert.equal(h.requests.length, 2);
});

test('dry run gets scenarios, prints planned URLs, never calls Airbnb or posts', async () => {
  const h = harness();
  await run({ ...h.options, dryRun: true });
  assert.equal(h.requests.length, 1);
  const plan = JSON.parse(h.logs[0]);
  assert.equal(plan.dryRun, true);
  assert.equal(plan.requests.length, 2);
  assert.equal(plan.requests[0].method, 'GET');
  assert.ok(!h.logs[0].includes(env.PRICE_CHECK_SECRET));
});

test('empty run posts an empty results list without Airbnb calls', async () => {
  const h = harness({ data: contract(0) });
  assert.deepEqual((await run(h.options)).quotes, []);
  assert.equal(h.requests.length, 2);
});

test('scenario HTTP or malformed-contract failure rejects and never calls Airbnb', async () => {
  for (const options of [{ scenarios: () => json({}, 500) }, { data: { runId: 'x' } }, { scenarios: () => { throw new Error('private internal URL'); } }]) {
    const h = harness(options);
    await assert.rejects(run(h.options), /Bunks scenarios/);
    assert.equal(h.requests.length, 1);
  }
});

test('results HTTP and network failures reject for a red Action without logging secrets', async () => {
  for (const post of [() => json({}, 500), () => { throw new Error(env.PRICE_CHECK_SECRET); }]) {
    const h = harness({ data: contract(0), post });
    await assert.rejects(run(h.options), (error) => !error.message.includes(env.PRICE_CHECK_SECRET));
  }
});

test('40-request cap includes bootstrap and retries; every scenario still gets a result', async () => {
  let calls = 0;
  const h = harness({ data: contract(45), airbnb: () => ++calls === 1 ? json({}, 503) : json(fixtures[0].response) });
  const result = await run(h.options);
  assert.equal(h.requests.filter((r) => r.url.origin.includes('airbnb')).length, 40);
  assert.equal(result.quotes.length, 45);
  assert.equal(result.quotes.filter((q) => q.status === 'ok').length, 38);
  assert.ok(result.quotes.slice(38).every((q) => q.status === 'error' && q.httpStatus === null));
});

test('retry once on network/5xx, respecting seconds Retry-After', async () => {
  for (const first of [() => { throw new Error('offline'); }, () => json({}, 503, { 'Retry-After': '7' })]) {
    let calls = 0, time = 0;
    const waits = [];
    const client = createAirbnbClient({ fetchFn: async () => ++calls === 1 ? first() : json({ ok: true }),
      now: () => time, random: () => 0, sleepFn: async (ms) => { waits.push(ms); time += ms; } });
    assert.equal((await client.get('https://www.airbnb.com/test')).status, 'ok');
    assert.equal(calls, 2);
    assert.ok(waits[1] >= 2000);
    if (waits[1] !== 2000) assert.equal(waits[1], 7000);
  }
});

test('network failure only retries once', async () => {
  const client = createAirbnbClient({ fetchFn: async () => { throw new Error('offline'); }, sleepFn: async () => {} });
  assert.equal((await client.get('https://www.airbnb.com/test')).status, 'error');
  assert.equal(client.count, 2);
});

test('timeout aborts request and retries at most once', async () => {
  const client = createAirbnbClient({ timeoutMs: 5, sleepFn: async () => {}, fetchFn: async (_url, { signal }) =>
    new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })) });
  assert.equal((await client.get('https://www.airbnb.com/test')).status, 'error');
  assert.equal(client.count, 2);
});

test('timeout also covers reading a response body', async () => {
  const client = createAirbnbClient({ timeoutMs: 5, sleepFn: async () => {}, fetchFn: async (_url, { signal }) => ({
    status: 200, headers: new Headers(), text: () => new Promise((_resolve, reject) =>
      signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })),
  }) });
  assert.equal((await client.get('https://www.airbnb.com/test')).status, 'error');
  assert.equal(client.count, 2);
});

test('long Retry-After stops remaining requests without retrying early', async () => {
  const h = harness({ airbnb: () => json({}, 503, { 'Retry-After': '3600' }) });
  const result = await run(h.options);
  assert.deepEqual(result.quotes.map((q) => q.status), ['blocked', 'blocked']);
  assert.equal(h.requests.filter((r) => r.url.pathname.startsWith('/api/v3')).length, 1);
});

test('HTTP-date Retry-After parses without negative waits', () => {
  const now = Date.parse('2026-09-27T00:00:00Z');
  assert.equal(retryAfterMs('Sun, 27 Sep 2026 00:00:10 GMT', now), 10000);
  assert.equal(retryAfterMs('Sun, 27 Sep 2026 00:00:00 GMT', now + 1000), 0);
  assert.equal(retryAfterMs('invalid', now), 0);
});

test('normal bootstrap mentioning recaptcha is not treated as a challenge', () => {
  assert.equal(isChallenge(bootstrap), false);
  assert.equal(isChallenge(JSON.stringify({ message: 'captcha' })), false);
  assert.equal(isChallenge('<html>CAPTCHA required</html>'), true);
  assert.equal(isChallenge('<script src="/cdn-cgi/challenge-platform/test.js"></script>'), true);
});

test('bad dates, duplicates, numeric listing IDs and non-USD are rejected', () => {
  for (const patch of [{ checkIn: '2026-02-30' }, { checkOut: scenario.checkIn }, { adults: 0 }, { listingId: 1552191060469626901 }, { pets: -1 }]) {
    const data = contract(1); Object.assign(data.scenarios[0], patch);
    assert.throws(() => validateScenarios(data));
  }
  const data = contract(); data.scenarios[1].scenarioId = data.scenarios[0].scenarioId;
  assert.throws(() => validateScenarios(data));
  assert.throws(() => validateScenarios({ ...contract(), currency: 'EUR' }));
});

test('unsafe base URLs fail before sending the bearer token', async () => {
  for (const base of ['http://bunks.example', 'https://user:pass@bunks.example', 'https://bunks.example?secret=x', 'https://bunks.example/path']) {
    const h = harness();
    await assert.rejects(run({ ...h.options, env: { ...env, BUNKS_BASE_URL: base } }), /HTTPS origin/);
    assert.equal(h.requests.length, 0);
  }
});

test('collection time budget preserves the final results POST', async () => {
  const h = harness({ data: contract(40), airbnb: () => json({}, 503, { 'Retry-After': '60' }) });
  const result = await run(h.options);
  assert.equal(result.quotes.length, 40);
  assert.ok(result.quotes.some((q) => q.error.includes('time budget')));
  assert.ok(h.requests.filter((r) => r.url.origin.includes('airbnb')).length < 40);
  assert.equal(h.requests.at(-1).options.method, 'POST');
});
