// Netlify v2 function. Keep the existing public endpoint used by ContactForm.
// Platform limits persist across instances; enforcement is asynchronous (up to 10s).
// Verify the applied rule in Netlify's deploy post-processing log.
// https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/
export const config = {
  path: '/.netlify/functions/send-email',
  rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] }
};

const MAX_BODY_BYTES = 32 * 1024;
const SINGLE_LINE = /[\u0000-\u001f\u007f]/;

async function readBody(request) {
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let text = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return text + decoder.decode();
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

function boundedText(value, max, required = false, singleLine = false) {
  return typeof value === 'string' && value.length <= max &&
    (!required || value.trim().length > 0) && (!singleLine || !SINGLE_LINE.test(value));
}

export default async function sendEmail(request) {
  // Origin filtering reduces browser abuse, but is not authentication. Bots can
  // omit/spoof Origin; the platform rate limit remains the abuse control.
  const allowedOrigins = new Set(['https://fresh-tech.uk', 'https://www.fresh-tech.uk']);
  if (process.env.DEPLOY_PRIME_URL) allowedOrigins.add(process.env.DEPLOY_PRIME_URL);
  if (process.env.NETLIFY_DEV === 'true') allowedOrigins.add('http://localhost:5173');
  const origin = request.headers.get('origin');
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Vary': 'Origin'
  };
  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  }
  const reply = (status, body) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowedOrigins.has(origin)) return reply(403, { error: 'Origin not allowed' });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') {
    headers.Allow = 'POST, OPTIONS';
    return reply(405, { error: 'Method not allowed' });
  }
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return reply(415, { error: 'Content-Type must be application/json' });
  }

  let input;
  try {
    const body = await readBody(request);
    if (body === null) return reply(413, { error: 'Request too large' });
    input = JSON.parse(body);
  } catch {
    return reply(400, { error: 'Invalid JSON body' });
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return reply(400, { error: 'Invalid form data' });
  }
  const { name, email, message, phone = '', honeypot = '', companySize = '', painPoint = '' } = input;
  if (!boundedText(name, 120, true, true) || !boundedText(email, 254, true, true) ||
      !boundedText(message, 5000, true) || !boundedText(phone, 50, false, true) ||
      !boundedText(honeypot, 200) || !boundedText(companySize, 100, false, true) ||
      !boundedText(painPoint, 1000) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return reply(400, { error: 'Please check the name, email, phone and message fields' });
  }
  if (honeypot.trim()) return reply(400, { error: 'Invalid form submission' });

  const apiKey = process.env.SMTP2GO_API_KEY;
  if (!apiKey) return reply(503, { error: 'Email service unavailable. Please call us instead.' });

  try {
    const phoneInfo = phone.trim() ? `\nPhone: ${phone.trim()}` : '';
    const contextInfo = (companySize.trim() ? `\nCompany size: ${companySize.trim()}` : '') + (painPoint.trim() ? `\nMain concern: ${painPoint.trim()}` : '');
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        api_key: apiKey,
        to: ['hello@fresh-tech.uk'],
        sender: 'website@fresh-tech.uk',
        subject: `New Lead: ${name.trim()}`,
        text_body: `Name: ${name.trim()}\nEmail: ${email.trim()}${phoneInfo}${contextInfo}\n\nMessage:\n${message.trim()}`,
        fastaccept: false
      })
    });
    const result = await response.json();
    // SMTP2GO can return HTTP 200 for failed sends. Acceptance isn't delivery.
    // https://developers.smtp2go.com/reference/send-standard-email
    const data = result?.data;
    if (!response.ok || result?.error || data?.error || data?.error_code ||
        data?.succeeded !== 1 || data?.failed !== 0 ||
        !Array.isArray(data?.failures) || data.failures.length !== 0) {
      return reply(502, { error: 'Failed to send email. Please call us instead.' });
    }
    return reply(200, { success: true, message: 'Message accepted for sending' });
  } catch {
    // Do not log upstream payloads/errors, which may include contact details.
    return reply(502, { error: 'Email service unavailable. Please call us instead.' });
  }
}
