import assert from 'node:assert/strict';
import test from 'node:test';
import { ContactSubmissionError, submissionAllowed, submitContact, type ContactPayload } from './contact-form.ts';

const payload: ContactPayload = { name: 'Test Person', email: 'test@example.test', phone: '', companySize: '', painPoint: '', message: 'Synthetic message', honeypot: '' };
function response(ok: boolean, body: unknown): Pick<Response, 'ok' | 'json'> { return { ok, json: async () => body }; }

test('accepts only an HTTP success with explicit semantic acceptance', async () => {
  let request: RequestInit | undefined;
  const result = await submitContact(payload, async (url, init) => { assert.equal(url, '/api/send-email'); request = init; return response(true, { success: true }); });
  assert.deepEqual(result, { success: true });
  assert.equal(request?.method, 'POST');
  assert.equal((request?.headers as Record<string, string>)['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(String(request?.body)), payload);
});

for (const [name, ok, body] of [['HTTP failure', false, { success: true }], ['semantic rejection', true, { success: false }], ['missing acceptance', true, {}], ['wrong acceptance type', true, { success: 'true' }]] as const) {
  test(`rejects ${name}`, async () => { await assert.rejects(submitContact(payload, async () => response(ok, body)), ContactSubmissionError); });
}

test('rejects malformed JSON', async () => {
  await assert.rejects(submitContact(payload, async () => ({ ok: true, json: async () => { throw new SyntaxError('bad json'); } })), ContactSubmissionError);
});

test('normalises network and timeout failures', async () => {
  await assert.rejects(submitContact(payload, async () => { throw new TypeError('offline'); }), ContactSubmissionError);
  await assert.rejects(submitContact(payload, (_url, init) => new Promise((_resolve, reject) => { init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))); }), 5), ContactSubmissionError);
});

test('allows test mode on loopback only and honours explicit enabled mode', () => {
  assert.equal(submissionAllowed('disabled', 'localhost'), false);
  assert.equal(submissionAllowed('test', 'localhost'), true);
  assert.equal(submissionAllowed('test', '127.0.0.1'), true);
  assert.equal(submissionAllowed('test', '[::1]'), true);
  assert.equal(submissionAllowed('test', 'preview.example.test'), false);
  assert.equal(submissionAllowed('enabled', 'localhost'), false);
  assert.equal(submissionAllowed('enabled', 'fresh-tech.uk'), true);
  assert.equal(submissionAllowed('enabled', 'www.fresh-tech.uk'), true);
  assert.equal(submissionAllowed('enabled', 'preview.example.test'), false);
});
