import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FREE_MAIL,
  LEAD_MESSAGE_MAX,
  LEAD_NAME_MAX,
  type CheckResult,
  type DohResponse,
  type Lookup,
  analyse,
  buildLeadPayload,
  captureLead,
  gradeDmarcPolicy,
  gradeSpfQualifier,
  isFreeMailDomain,
  isValidEmail,
  matchSpfService,
  normaliseDomain,
} from './email-checker.ts';

// Pure-function tests only: no fetch, no DOM. analyse() takes an injectable
// lookup function so DNS never leaves the test process.

test('gradeSpfQualifier: +all is red, ?all and missing are amber, ~all/-all are green', () => {
  assert.equal(gradeSpfQualifier('+'), 'red');
  assert.equal(gradeSpfQualifier('?'), 'amber');
  assert.equal(gradeSpfQualifier(undefined), 'amber');
  assert.equal(gradeSpfQualifier('~'), 'green');
  assert.equal(gradeSpfQualifier('-'), 'green');
});

test('gradeDmarcPolicy: reject and quarantine are green, none (or anything else) is amber', () => {
  assert.equal(gradeDmarcPolicy('reject'), 'green');
  assert.equal(gradeDmarcPolicy('quarantine'), 'green');
  assert.equal(gradeDmarcPolicy('QUARANTINE'), 'green');
  assert.equal(gradeDmarcPolicy('none'), 'amber');
  assert.equal(gradeDmarcPolicy('bogus'), 'amber');
});

test('matchSpfService: recognises common includes and returns null for unknown hosts', () => {
  assert.equal(matchSpfService('spf.protection.outlook.com'), 'Microsoft 365');
  assert.equal(matchSpfService('_spf.google.com'), 'Google Workspace');
  assert.equal(matchSpfService('sendgrid.net'), 'SendGrid');
  assert.equal(matchSpfService('mail.some-random-vendor.example'), null);
});

test('isFreeMailDomain: flags well-known personal providers only', () => {
  assert.equal(isFreeMailDomain('gmail.com'), true);
  assert.equal(isFreeMailDomain('hotmail.co.uk'), true);
  assert.equal(isFreeMailDomain('fresh-tech.uk'), false);
  assert.equal(FREE_MAIL.has('outlook.com'), true);
});

test('isValidEmail: requires an @ and a dot in the domain part', () => {
  assert.equal(isValidEmail('sam@fresh-tech.uk'), true);
  assert.equal(isValidEmail('sam@localhost'), false);
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isValidEmail('sam @fresh-tech.uk'), false);
});

test('normaliseDomain: strips scheme, path and leading www', () => {
  assert.equal(normaliseDomain('https://www.fresh-tech.uk/contact'), 'fresh-tech.uk');
  assert.equal(normaliseDomain(' Fresh-Tech.UK '), 'fresh-tech.uk');
  assert.equal(normaliseDomain('fresh-tech.uk'), 'fresh-tech.uk');
});

// A fake DNS-over-HTTPS resolver keyed by "name type", used to drive analyse()
// end to end without any network access.
function fakeDoh(records: Record<string, DohResponse>): Lookup {
  return async (name, type) => records[`${name} ${type}`] ?? { Answer: [] };
}

test('analyse: a fully locked-down domain reports green across the board', async () => {
  const doh = fakeDoh({
    '_dmarc.example.co.uk TXT': { Answer: [{ type: 16, data: '"v=DMARC1; p=reject"' }] },
    'example.co.uk TXT': { Answer: [{ type: 16, data: '"v=spf1 include:spf.protection.outlook.com -all"' }] },
    'selector1._domainkey.example.co.uk TXT': { Answer: [{ type: 16, data: '"v=DKIM1; k=rsa; p=abcdefghijklmnopqrstuvwxyz"' }] },
    'example.co.uk MX': { Answer: [{ type: 15, data: 'example-co-uk.mail.protection.outlook.com' }] },
    '_mta-sts.example.co.uk TXT': { Answer: [{ type: 16, data: '"v=STSv1; id=1"' }] },
    'example.co.uk DS': { Answer: [{ type: 43, data: 'fake-ds-record' }] },
  });
  const results = await analyse('example.co.uk', doh);
  const byKey = Object.fromEntries(results.map(r => [r.key, r]));
  assert.equal(byKey.dmarc.status, 'green');
  assert.equal(byKey.spf.status, 'green');
  assert.equal(byKey.spf.details?.[0]?.kind, 'service');
  assert.equal(byKey.dkim.status, 'green');
  assert.equal(byKey.mx.status, 'green');
  assert.equal(byKey.mtasts.status, 'green');
  assert.equal(byKey.dnssec.status, 'green');
});

test('analyse: a wide-open domain reports red on DMARC and SPF, amber elsewhere', async () => {
  const doh = fakeDoh({}); // every lookup misses
  const results = await analyse('wide-open.example', doh);
  const byKey = Object.fromEntries(results.map(r => [r.key, r]));
  assert.equal(byKey.dmarc.status, 'red');
  assert.equal(byKey.spf.status, 'red');
  assert.equal(byKey.dkim.status, 'amber');
  assert.equal(byKey.mx.status, 'amber');
  assert.equal(byKey.mtasts.status, 'amber');
  assert.equal(byKey.dnssec.status, 'amber');
});

test('analyse: SPF include not in the known-service list is flagged unknown', async () => {
  const doh = fakeDoh({
    'unknown-spf.example TXT': { Answer: [{ type: 16, data: '"v=spf1 include:mail.some-random-vendor.example ~all"' }] },
  });
  const results = await analyse('unknown-spf.example', doh);
  const spf = results.find(r => r.key === 'spf');
  assert.equal(spf?.status, 'green');
  assert.equal(spf?.details?.some(d => d.kind === 'unknown'), true);
  assert.match(spf?.meaning ?? '', /couldn't identify 1 of the senders/);
});

test('analyse: a lookup that throws is reported as amber with a "couldn\'t confirm" message', async () => {
  const doh: Lookup = async () => { throw new Error('network down'); };
  const results = await analyse('broken.example', doh);
  for (const result of results) {
    assert.equal(result.status, 'amber');
    assert.match(result.finding, /Couldn't read/);
  }
});

const leadResults: CheckResult[] = [
  { key: 'dmarc', label: 'DMARC', status: 'red', finding: 'No DMARC record', meaning: 'x' },
  { key: 'spf', label: 'SPF', status: 'amber', finding: 'Soft policy', meaning: 'x', details: [{ text: 'Microsoft 365', kind: 'service' }, { text: 'unknown.example', kind: 'unknown' }] },
  { key: 'mx', label: 'Mail platform', status: 'green', finding: 'Microsoft 365', meaning: 'x' },
];

test('buildLeadPayload: matches the React captureLead message format', () => {
  const payload = buildLeadPayload('example.co.uk', ' owner@example.co.uk ', leadResults, true);
  assert.deepEqual(payload, {
    name: 'example.co.uk (Email Security Check)',
    email: 'owner@example.co.uk',
    message: [
      'Email security check submitted via the website tool.',
      '',
      'Domain: example.co.uk',
      'Overall: EXPOSED (1 red, 1 amber)',
      'Marketing opt-in: YES',
      '',
      'Results:',
      '- DMARC [RED]: No DMARC record',
      '- SPF [AMBER]: Soft policy\n    Microsoft 365\n    unknown.example',
      '- Mail platform [GREEN]: Microsoft 365',
    ].join('\n'),
  });
  assert.match(buildLeadPayload('a.example', 'a@a.example', [leadResults[2]], false)?.message ?? '', /Overall: SOLID\nMarketing opt-in: no/);
  assert.match(buildLeadPayload('a.example', 'a@a.example', [leadResults[1]], false)?.message ?? '', /Overall: GAPS \(1 amber\)/);
});

test('buildLeadPayload: keeps every field within the send-email.php limits', () => {
  const longDomain = `${'sub.'.repeat(60)}example.co.uk`;
  const noisy: CheckResult[] = Array.from({ length: 80 }, (_, i) => ({
    key: `k${i}`, label: 'SPF', status: 'amber', finding: `finding ${i}\u0007`, meaning: 'x',
    details: [{ text: `"v=spf1 ${'include:very-long-vendor.example '.repeat(4)}"`, kind: 'other' }],
  }));
  const payload = buildLeadPayload(`${longDomain}\t\u2028`, 'owner@example.co.uk', noisy, false);
  assert.ok(payload);
  assert.ok(payload.name.length <= LEAD_NAME_MAX);
  assert.ok(payload.name.endsWith(' (Email Security Check)'));
  assert.doesNotMatch(payload.name, /[\u0000-\u001f\u007f\u0085\u2028\u2029]/);
  assert.ok(payload.message.length <= LEAD_MESSAGE_MAX);
  assert.ok(payload.message.endsWith('\n[truncated]'));
  assert.doesNotMatch(payload.message, /[\u0000-\u0009\u000b-\u001f\u007f]/);
  assert.ok(Buffer.byteLength(JSON.stringify(payload)) < 32 * 1024);
});

test('buildLeadPayload: never splits a surrogate pair and rejects unusable emails', () => {
  const emoji = '\u{1F600}'.repeat(3000);
  const payload = buildLeadPayload('example.com', 'a@example.com', [{ key: 'x', label: 'X', status: 'green', finding: emoji, meaning: 'x' }], false);
  assert.ok(payload);
  assert.doesNotMatch(payload.message, /[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  assert.equal(buildLeadPayload('example.com', 'not-an-email', leadResults, false), null);
  assert.equal(buildLeadPayload('example.com', `${'a'.repeat(250)}@example.com`, leadResults, false), null);
});

test('captureLead: posts once, fire-and-forget, only when enabled on an allowed host', async () => {
  const payload = buildLeadPayload('example.co.uk', 'owner@example.co.uk', leadResults, false);
  const calls: [string, RequestInit][] = [];
  const fakeFetch = async (input: string, init: RequestInit) => { calls.push([input, init]); return new Response('{}'); };

  assert.equal(captureLead(payload, undefined, 'fresh-tech.uk', fakeFetch), false);
  assert.equal(captureLead(payload, 'enabled', 'preview.fresh-tech.uk', fakeFetch), false);
  assert.equal(captureLead(payload, 'enabled', 'localhost', fakeFetch), false);
  assert.equal(captureLead(null, 'enabled', 'fresh-tech.uk', fakeFetch), false);
  assert.equal(calls.length, 0);

  assert.equal(captureLead(payload, 'enabled', 'fresh-tech.uk', fakeFetch), true);
  assert.equal(captureLead(payload, 'enabled', 'www.fresh-tech.uk', fakeFetch), true);
  assert.equal(calls.length, 2);
  const [url, init] = calls[0];
  assert.equal(url, '/api/send-email');
  assert.equal(init.method, 'POST');
  assert.deepEqual(init.headers, { 'Content-Type': 'application/json' });
  assert.deepEqual(JSON.parse(String(init.body)), payload);

  // A rejected or throwing fetch never surfaces to the caller.
  assert.equal(captureLead(payload, 'enabled', 'fresh-tech.uk', async () => { throw new Error('offline'); }), true);
  assert.equal(captureLead(payload, 'enabled', 'fresh-tech.uk', () => { throw new Error('sync'); }), true);
  await new Promise(resolve => setImmediate(resolve));
});
