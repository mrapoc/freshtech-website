import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('../dist/contact/index.html', import.meta.url), 'utf8');
const visibleHtml = html.replaceAll('&#39;', "'").replaceAll('&amp;', '&');
const expectedMode = process.env.EXPECT_CONTACT_MODE ?? 'disabled';
for (const fragment of [
  '<title>Book a Call: IT Support Shropshire | Fresh Tech IT Support</title>',
  '<meta name="description" content="Book a free 20-minute call with Fresh Tech, IT support for Shropshire businesses. No sales script, no obligation. Call 01584 517 234 or pick a time online.">',
  '<meta name="robots" content="noindex, nofollow">',
  '<link rel="canonical" href="https://fresh-tech.uk/contact">',
  'href="https://calendly.com/fresh-sam/20min" target="_blank" rel="noopener noreferrer"',
  'External booking service opens in a new tab.',
  'Two engineers.',
  "Pick how you'd like to start",
  'How quickly will you actually respond?',
  "We're already under contract with our IT provider, can we still talk?",
  'Do you cover our area?',
  'Is there a minimum contract?',
  'Our standard service is on a 30-day rolling term unless a signed Proposal says otherwise.',
  'href="/terms-of-business">Terms of Business</a>',
  'Ludlow', 'Shrewsbury', 'Hereford', 'Telford', 'Leominster', 'Craven Arms', 'Church Stretton', 'Bridgnorth', 'Oswestry', 'Welshpool',
  '01584 517 234', 'hello@fresh-tech.uk', 'support@fresh-tech.uk', 'id="main-content"',
]) {
  if (!visibleHtml.includes(fragment)) throw new Error(`Contact output is missing: ${fragment}`);
}
const schemaMatch = html.match(/<script id="json-ld-schema" type="application\/ld\+json">([^<]+)<\/script>/);
if (!schemaMatch) throw new Error('Contact schemas are missing.');
const schemaTypes = JSON.parse(schemaMatch[1]).map(schema => schema['@type']);
if (JSON.stringify(schemaTypes) !== JSON.stringify([['LocalBusiness', 'ProfessionalService'], 'Organization', 'BreadcrumbList'])) throw new Error(`Unexpected contact schema types: ${JSON.stringify(schemaTypes)}`);
if (expectedMode === 'disabled') {
  if (!html.includes('data-contact-disabled')) throw new Error('Disabled preview notice is missing.');
  if (html.includes('data-contact-form')) throw new Error('The default preview unexpectedly contains an active contact form.');
  if (html.includes('/api/send-email')) throw new Error('The default preview unexpectedly contains the contact endpoint path.');
} else {
  if (!html.includes('data-contact-form')) throw new Error('The contact form is missing.');
  if (!html.includes(`data-submission-mode="${expectedMode}"`)) throw new Error(`Expected ${expectedMode} submission mode.`);
}
if (/assets\.calendly\.com|calendly-inline-widget|hide_gdpr_banner/i.test(html)) throw new Error('An eager scheduling embed leaked into the static contact route.');
for (const unsupportedClaim of ['usually under 15 minutes', 'Reply within the hour', 'usually available within the week', 'reasonable initial term']) {
  if (visibleHtml.includes(unsupportedClaim)) throw new Error(`Unsupported contact claim remains: ${unsupportedClaim}`);
}
if (html.includes('—')) throw new Error('Public contact output contains an em dash.');
console.log(`Contact output contract passed (${expectedMode}).`);
