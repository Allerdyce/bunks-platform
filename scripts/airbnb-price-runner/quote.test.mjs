import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BOOKIT_HASH, extractApiKey, parseQuote, quoteUrl, usdCents } from './quote.mjs';

const fixtures = JSON.parse(await readFile(new URL('./fixtures/verified-quotes.json', import.meta.url), 'utf8'));
const scenario = { scenarioId: 'fixture-1', listingId: '1552191060469626901', checkIn: '2026-11-10', checkOut: '2026-11-13', adults: 2, pets: 0 };
const response = () => structuredClone(fixtures[0].response);
const bookIt = (data) => data.data.node.pdpPresentation.bookIt;

test('verified quotes produce exact cents, fee flag, label, nights and cancellation', () => {
  for (const [index, cents] of [145000, 300300].entries()) {
    const quote = parseQuote(fixtures[index].response, scenario);
    assert.equal(quote.status, 'ok');
    assert.equal(quote.totalCents, cents);
    assert.equal(quote.feesIncluded, true);
    assert.match(quote.priceLabel, /for 3 nights/);
    assert.match(quote.nightsLine, /3 nights x \$/);
    assert.equal(quote.cancellation, 'Free cancellation before October 11');
    assert.equal(quote.httpStatus, 200);
  }
});

test('unavailable response has no amount even when a stale display price remains', () => {
  const data = response();
  bookIt(data).availability = { isAvailable: false, unavailabilityMessage: 'Minimum 4 nights' };
  const quote = parseQuote(data, scenario);
  assert.equal(quote.status, 'unavailable');
  assert.equal(quote.unavailableReason, 'Minimum 4 nights');
  assert.equal('totalCents' in quote, false);
  assert.equal(quote.error, null);
});

test('GraphQL errors override otherwise valid data', () => {
  const data = response();
  data.errors = [{ message: 'Internal detail should not be reported' }];
  assert.equal(parseQuote(data, scenario).status, 'error');
  assert.equal('totalCents' in parseQuote(data, scenario), false);
});

test('missing bookIt or explicit availability fails closed', () => {
  assert.equal(parseQuote({}, scenario).status, 'error');
  const data = response();
  delete bookIt(data).availability;
  assert.equal(parseQuote(data, scenario).status, 'error');
});

test('unparseable preferred price does not silently fall back to another amount', () => {
  const data = response();
  bookIt(data).productItemDetail.explanationData.priceDetails[1].items[0].priceString = '€1.450';
  assert.equal(parseQuote(data, scenario).status, 'error');
});

test('price preference is discount total, nights line total, then primary price', () => {
  const data = response();
  const book = bookIt(data);
  book.productItemDetail.explanationData.priceDetails[1].items[0].priceString = '$1,400.01';
  assert.equal(parseQuote(data, scenario).totalCents, 140001);
  book.productItemDetail.explanationData.priceDetails.pop();
  assert.equal(parseQuote(data, scenario).totalCents, 145000);
  delete book.productItemDetail;
  delete book.structuredDisplayPrice.explanationData;
  book.structuredDisplayPrice.primaryLine.price = '$1,450.56';
  assert.equal(parseQuote(data, scenario).totalCents, 145056);
});

test('missing fee announcement does not assert fees included', () => {
  const data = response();
  delete bookIt(data).announcement;
  assert.equal(parseQuote(data, scenario).feesIncluded, false);
});

test('strict positive USD parser rejects ambiguous, malformed, rounded or zero input', () => {
  for (const [price, cents] of [['$1,234', 123400], ['$1,234.56', 123456], ['$1234.56', 123456], ['$0.01', 1]]) assert.equal(usdCents(price), cents);
  for (const price of ['€1.450', '$1.2', '$1,23', '$0', '$0.00', '$01', '-$5', ' $5', '$1,000 per night', '$1.234,56', '$9,999,999,999,999,999', 1450, null]) assert.equal(usdCents(price), null, String(price));
});

test('bootstrap key supports raw JSON and HTML entity escaped JSON', () => {
  const json = JSON.stringify({ 'layout-init': { api_config: { key: 'public-test-key' } } });
  for (const body of [json, json.replaceAll('"', '&quot;'), json.replaceAll('"', '&#34;'), json.replaceAll('"', '&#x22;')]) {
    assert.equal(extractApiKey(`<script type="application/json" id='data-initializer-bootstrap'>${body}</script>`), 'public-test-key');
  }
  assert.throws(() => extractApiKey('<html></html>'));
  assert.throws(() => extractApiKey('<script id="data-initializer-bootstrap">{}</script>'));
});

test('quote request preserves scenario and exact persisted-query shape', () => {
  const url = quoteUrl(scenario);
  assert.equal(url.pathname, `/api/v3/StaysPdpBookItQuery/${BOOKIT_HASH}`);
  assert.equal(url.searchParams.get('currency'), 'USD');
  assert.equal(url.searchParams.get('locale'), 'en');
  const vars = JSON.parse(url.searchParams.get('variables'));
  assert.equal(Buffer.from(vars.id, 'base64').toString(), `DemandStayListing:${scenario.listingId}`);
  assert.deepEqual(vars.guestCounts, { numberOfAdults: 2 });
  assert.deepEqual(vars.dateRange, { startDate: scenario.checkIn, endDate: scenario.checkOut });
  assert.equal(vars.selectedCancellationPolicyId, null);
  assert.equal(vars.includePdpMigrationBookItSidebarFragment, true);
  assert.deepEqual(JSON.parse(url.searchParams.get('extensions')), { persistedQuery: { version: 1, sha256Hash: BOOKIT_HASH } });
  const petVars = JSON.parse(quoteUrl({ ...scenario, pets: 1 }).searchParams.get('variables'));
  assert.deepEqual(petVars.guestCounts, { numberOfAdults: 2, numberOfPets: 1 });
  assert.notEqual(petVars.p3ImpressionId, vars.p3ImpressionId);
});
