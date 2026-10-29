import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMetrics, parseFeedback, formatTime, formatBusinessTime, formatRate, TICKET_DEFINITION, formatPeriod, formatMonth, retainFeedback, readFeed, utc } from './website-proof.mjs';
import { metricsFixture, feedbackFixture, FIXTURE_NOW, emptyMetric } from '../../scripts/fixtures/website-proof.mjs';
test('reviewed support queue mean and rate travel together, with exclusive UK dates', () => {
  const result = parseMetrics(metricsFixture(), FIXTURE_NOW);
  assert.equal(result.length, 1); assert.equal(formatTime(result[0].value_seconds), '25 seconds');
  assert.equal(formatRate(result[0].service_rate_percent), '93.7%');
  assert.equal(formatPeriod(result[0]), '25 August 2026 to 21 September 2026');
});
test('available ticket stays hidden until its definition is reviewed', () => {
  const data = metricsFixture(); data.status = 'available';
  data.metrics.ticket_first_response = { ...data.metrics.call_wait, source: 'superops', definition_id: 'unapproved.future.ticket' };
  assert.deepEqual(parseMetrics(data, FIXTURE_NOW).map(value => value.key), ['call_wait']);
});
test('approved ticket first reply travels with its rate, after calls, and alone', () => {
  const data = metricsFixture(); data.status = 'available';
  data.metrics.ticket_first_response = { ...data.metrics.call_wait, source: 'superops', definition_id: TICKET_DEFINITION, value_seconds: 3357.1, service_rate_percent: 66.4 };
  const result = parseMetrics(data, FIXTURE_NOW);
  assert.deepEqual(result.map(value => value.key), ['call_wait', 'ticket_first_response']);
  assert.equal(formatBusinessTime(result[1].value_seconds), '56 business minutes'); assert.equal(formatRate(result[1].service_rate_percent), '66.4%');
  data.metrics.call_wait.definition_id = 'future.v2';
  assert.deepEqual(parseMetrics(data, FIXTURE_NOW).map(value => value.key), ['ticket_first_response']);
  for (const [input, expected] of [[30, '30 business seconds'], [60, '1 business minute'], [5400, '1.5 business hours']]) assert.equal(formatBusinessTime(input), expected);
});
for (const value of [null, -1, Infinity, '12', true]) test(`invalid timing ${String(value)} hides`, () => {
  const data = metricsFixture(); data.metrics.call_wait.value_seconds = value; assert.deepEqual(parseMetrics(data, FIXTURE_NOW), []);
});
for (const value of [null, -1, 100.01, Infinity, '99', true]) test(`invalid percentage ${String(value)} hides timing too`, () => {
  const data = metricsFixture(); data.metrics.call_wait.service_rate_percent = value; assert.deepEqual(parseMetrics(data, FIXTURE_NOW), []);
});
test('zero is genuine; positive fractions round up and rates never inflate', () => {
  for (const [input, expected] of [[0, '0 seconds'], [.001, '1 second'], [59.9, '60 seconds'], [60, '1 minute'], [60.01, '1.1 minutes'], [3601, '1.1 hours']]) assert.equal(formatTime(input), expected);
  assert.equal(formatRate(99.999), '99.9%'); assert.equal(formatRate(0), '0%'); assert.equal(formatRate(100), '100%');
  const data = metricsFixture(); data.metrics.call_wait.value_seconds = 0; data.metrics.call_wait.service_rate_percent = 0;
  assert.equal(parseMetrics(data, FIXTURE_NOW).length, 1);
});
test('unknown version/fields/definition and inconsistent status fail closed', () => {
  for (const mutate of [data => data.schema_version = 3, data => data.private = 'not public', data => data.status = 'available', data => data.metrics.call_wait.definition_id = 'future.v2', data => data.metrics.call_wait.count = 100]) {
    const data = metricsFixture(); mutate(data); assert.deepEqual(parseMetrics(data, FIXTURE_NOW), []);
  }
});
test('unavailable, stale, expired, future and invalid dates hide', () => {
  for (const mutate of [data => { data.status = 'unavailable'; data.metrics.call_wait = emptyMetric('yeastar'); },
    data => { data.status = 'unavailable'; data.metrics.call_wait.status = 'stale'; }, data => data.metrics.call_wait.expires_at = '2026-09-22T12:00:00Z',
    data => data.metrics.call_wait.observed_at = '2026-09-22T12:00:01Z', data => data.metrics.call_wait.expires_at = '2026-09-24T13:59:01Z',
    data => data.metrics.call_wait.period_start = '2026-02-30T00:00:00Z', data => data.metrics.call_wait.period_end = '2026-09-21T22:00:00Z']) {
    const data = metricsFixture(); mutate(data); assert.deepEqual(parseMetrics(data, FIXTURE_NOW), []);
  }
  assert.ok(Number.isNaN(utc('2026-02-30T00:00:00Z')));
});
test('28 London calendar days spanning daylight saving', () => {
  const data = metricsFixture(); Object.assign(data.metrics.call_wait, { period_start: '2026-03-08T00:00:00Z', period_end: '2026-04-04T23:00:00Z', observed_at: '2026-04-05T08:00:00Z', expires_at: '2026-04-05T08:30:00Z' });
  assert.equal(parseMetrics(data, Date.parse('2026-04-05T08:01:00Z')).length, 1);
});
test('feedback preserves original wording, month and optional rating', () => {
  const data = feedbackFixture(), parsed = parseFeedback(data, FIXTURE_NOW);
  assert.deepEqual(parsed.items, data.items); assert.equal(formatMonth(parsed.items[0].feedback_month), 'August 2026');
});
test('feedback rejects bad shape/private fields, invalid dates/version/expiry', () => {
  for (const mutate of [data => data.schema_version = 2, data => data.items[0].surname = 'Private', data => data.items[0].rating = 5,
    data => data.items[0].comment = '', data => data.items[0].feedback_month = '2026-13', data => data.items.push(data.items[0]),
    data => data.expires_at = '2026-09-22T12:00:00Z', data => data.expires_at = '2026-09-25T00:00:01Z', data => data.selected_on = '2026-09-23',
    data => data.status = 'stale', data => data.status = 'unavailable']) {
    const data = feedbackFixture(); mutate(data); assert.equal(parseFeedback(data, FIXTURE_NOW), null);
  }
});
test('withdrawals remove without replacing, changing or reordering cards', () => {
  const old = feedbackFixture().items;
  assert.deepEqual(retainFeedback(old, { items: [{ ...old[0], comment: 'Changed wording requires new visit' }, old[2], old[1]] }), [old[1], old[2]]);
  assert.deepEqual(retainFeedback(old, null), []);
});
test('reader rejects errors, HTML, malformed JSON and bodies over 8192 bytes', async () => {
  const json = value => new Response(value, { headers: { 'Content-Type': 'application/json' } });
  assert.deepEqual(await readFeed(json(JSON.stringify(metricsFixture()))), metricsFixture());
  for (const response of [new Response('{}', { status: 404 }), new Response('{}', { status: 429 }), new Response('<html>'), json('{'), json(' '.repeat(8193)), new Response('{}', { headers: { 'Content-Type': 'application/json', 'Content-Length': '8193' } })]) await assert.rejects(readFeed(response));
});
