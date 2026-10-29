// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sendEmail from '../../netlify/functions/send-email.js';

const valid = { name: 'Example Visitor', email: 'visitor@example.com', phone: '', message: 'Please call about IT support.' };
const accepted = { data: { succeeded: 1, failed: 0, failures: [] } };
const fetchMock = vi.fn();
function request(body: unknown = valid, headers: Record<string, string> = {}) {
  return new Request('https://fresh-tech.uk/.netlify/functions/send-email', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

beforeEach(() => {
  vi.stubEnv('SMTP2GO_API_KEY', 'synthetic-test-key');
  vi.stubEnv('DEPLOY_PRIME_URL', '');
  vi.stubEnv('NETLIFY_DEV', '');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue(Response.json(accepted));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetAllMocks(); });

describe('send-email boundary', () => {
  it.each(['{', '', 'null', '[]', 'false'])('rejects malformed or non-object JSON: %s', async body => {
    expect((await sendEmail(request(body))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    { name: {} }, { name: ' ' }, { name: 'a'.repeat(121) }, { name: 'A\r\nBcc: a@example.com' },
    { email: [] }, { email: 'invalid' }, { email: 'a'.repeat(250) + '@example.com' },
    { phone: 123 }, { phone: '1'.repeat(51) }, { message: null }, { message: ' ' },
    { companySize: {} }, { painPoint: 'x'.repeat(1001) }, { message: 'x'.repeat(5001) }, { honeypot: 'bot' }, { honeypot: {} }
  ])('rejects invalid fields %j', async fields => {
    expect((await sendEmail(request({ ...valid, ...fields }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('caps actual UTF-8 bytes even without a Content-Length header', async () => {
    expect((await sendEmail(request({ ...valid, extra: '😀'.repeat(9000) }))).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('rejects a declared oversized body before reading it', async () => {
    expect((await sendEmail(request(valid, { 'Content-Length': '40000' }))).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('rejects non-JSON posts', async () => {
    expect((await sendEmail(request(valid, { 'Content-Type': 'text/plain' }))).status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('rejects foreign origins and supplies no permissive CORS header', async () => {
    const response = await sendEmail(request(valid, { Origin: 'https://untrusted.example' }));
    expect(response.status).toBe(403);
    expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('supports allowed-origin preflight and rejects other methods', async () => {
    const url = 'https://fresh-tech.uk/.netlify/functions/send-email';
    const options = await sendEmail(new Request(url, { method: 'OPTIONS', headers: { Origin: 'https://fresh-tech.uk' } }));
    expect(options.status).toBe(204);
    expect(options.headers.get('Access-Control-Allow-Origin')).toBe('https://fresh-tech.uk');
    const get = await sendEmail(new Request(url));
    expect(get.status).toBe(405);
    expect(get.headers.get('Allow')).toBe('POST, OPTIONS');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('fails safely when the service is unconfigured', async () => {
    vi.stubEnv('SMTP2GO_API_KEY', '');
    expect((await sendEmail(request())).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('keeps recipient and sender fixed and accepts the existing payload', async () => {
    const response = await sendEmail(request({ ...valid, name: ' Example Visitor ', to: ['attacker@example.com'], sender: 'attacker@example.com', companySize: '10', painPoint: 'Security' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.smtp2go.com/v3/email/send');
    expect(JSON.parse(options.body)).toMatchObject({
      to: ['hello@fresh-tech.uk'], sender: 'website@fresh-tech.uk', subject: 'New Lead: Example Visitor',
      text_body: `Name: Example Visitor\nEmail: visitor@example.com\nCompany size: 10\nMain concern: Security\n\nMessage:\n${valid.message}`, fastaccept: false
    });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
  it.each([
    { data: { succeeded: 0, failed: 1, failures: ['private provider detail'] } },
    { data: { ...accepted.data, error: 'private provider detail' } },
    { data: { ...accepted.data, failures: ['failed'] } },
    {}, null
  ])('does not report success for an HTTP 200 error or unrecognised payload', async payload => {
    fetchMock.mockResolvedValue(Response.json(payload));
    const response = await sendEmail(request());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('private provider detail');
  });
  it('fails on upstream HTTP errors even with a success-shaped payload', async () => {
    fetchMock.mockResolvedValue(Response.json(accepted, { status: 500 }));
    expect((await sendEmail(request())).status).toBe(502);
  });
  it.each(['invalid-json', 'timeout'])('handles upstream %s without leaking details', async failure => {
    if (failure === 'invalid-json') fetchMock.mockResolvedValue(new Response('private provider detail'));
    else fetchMock.mockRejectedValue(new Error('private provider detail'));
    const response = await sendEmail(request());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('private provider detail');
  });
});
