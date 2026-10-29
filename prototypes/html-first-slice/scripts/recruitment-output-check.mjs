import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { RECRUITMENT, canAcceptApplications } from '../src/lib/recruitment.mjs';

// Output contract for the published advert and the recruitment privacy notice.
// The notice is final independently of whether applications are open, and its
// effective date is read from src/lib/recruitment.mjs so the two cannot drift.
// A closed advert must stay visibly closed with no CV route of any kind. An
// open advert may carry exactly one CV route in its main content: the
// dedicated recruitment mailbox configured as the listing URL, never a
// personal or general inbox and never an on-page form.
const dist = resolve(process.argv[2] ?? 'dist');
const career = await readFile(resolve(dist, 'careers/index.html'), 'utf8');
const privacy = await readFile(resolve(dist, 'recruitment-privacy/index.html'), 'utf8');
const visible = html => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]*>/g, ' ').replace(/&#39;|&#x27;/g, "'").replace(/\s+/g, ' ');
const main = html => html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
const copy = visible(career);
const notice = visible(privacy);

// Agreed job terms, verbatim.
for (const required of ['£30,000', '£35,000', "You don't need to live in Ludlow", 'Shropshire, north Herefordshire', '37.5 hours', '25 days', '3% of qualifying earnings', '55p', '25p', 'basic DBS check paid for by Fresh Tech', 'after a conditional offer', 'valid for UK driving', 'personal phone']) assert.ok(copy.includes(required), `Missing agreed term: ${required}`);
assert.ok(career.includes('href="/recruitment-privacy"'), 'Advert must link the recruitment privacy notice');
assert.ok(privacy.includes('href="/careers"'), 'Notice must link back to the advert');

// Shared structural rules.
for (const html of [career, privacy]) assert.ok(!html.includes('class="footer-cta"'), 'No customer-sales banner on recruitment pages');
assert.ok(!career.includes('class="careers-status"') && !privacy.includes('class="rp-status"'), 'No repeated pre-launch warning banners');
for (const html of [career, privacy]) {
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, 'Exactly one H1');
  assert.ok(!html.includes('"@type":"JobPosting"'), 'No JobPosting until the application route is live and separately reviewed');
  assert.ok(!/<form(?:\s|>)/.test(main(html)), 'No applicant collection form');
  assert.ok(!visible(html).includes('—'), 'No em dashes');
}
// The notice carries the data-protection contact, never the CV mailbox: a
// candidate's rights request goes to that address, applications do not.
const noticeMailtos = [...new Set([...main(privacy).matchAll(/href="(mailto:[^"]+)"/g)].map(match => match[1]))];
assert.deepEqual(noticeMailtos, [`mailto:${RECRUITMENT.privacyContact}`], 'The notice links the data-protection contact only');

// The advert's CV route, if any, is the configured recruitment mailbox alone.
const advertMailtos = [...new Set([...main(career).matchAll(/href="(mailto:[^"]+)"/g)].map(match => match[1]))];

// Privacy notice: final, with the approved substance present and no draft wording.
for (const required of [`Effective ${RECRUITMENT.privacyEffectiveDate}`, 'Article 6(1)(f)', 'Article 6(1)(c)', 'Article 9(2)(b)', 'Article 10 condition', 'paragraphs 10 and 36', 'six months after the recruitment closes', 'Sam deletes', 'never keep a copy, photo or scan', 'paid for by Fresh Tech', 'after a conditional offer', 'never an automatic rejection', 'only Sam can open', 'do not rely on your consent']) assert.ok(notice.includes(required), `Notice missing approved substance: ${required}`);
for (const forbidden of ['Draft notice', 'Not yet in force', 'draft', 'still being confirmed', 'formally adopt', 'proposal']) assert.ok(!notice.toLowerCase().includes(forbidden.toLowerCase()), `Notice still carries draft wording: ${forbidden}`);
assert.ok(!notice.includes('verified LinkedIn') && !notice.includes('checked its application and access settings'), 'Do not claim LinkedIn settings are verified');

// Application state: a route only once the source declares a validated listing.
if (!canAcceptApplications(RECRUITMENT.applications)) {
  assert.ok(copy.includes('Applications opening shortly'), 'Closed advert must say applications are opening shortly');
  assert.ok(!career.includes('Apply on LinkedIn →'), 'No apply button while closed');
  assert.ok(!/href="https?:\/\/(?:[a-z]+\.)?linkedin\.com\/jobs/.test(main(career)), 'No LinkedIn job link while closed');
  assert.deepEqual(advertMailtos, [], 'No email route for CVs while applications are closed');
} else {
  assert.ok(career.includes(RECRUITMENT.applications.listingUrl), 'Open advert must link the validated listing');
  assert.ok(!copy.includes('Applications opening shortly'), 'Open advert must not say opening shortly');
  assert.deepEqual(advertMailtos, [RECRUITMENT.applications.listingUrl], "The advert's only CV route is the configured recruitment mailbox");
}
console.log(`Recruitment output contract passed: advert ${canAcceptApplications(RECRUITMENT.applications) ? 'open' : 'closed'}, final privacy notice, agreed terms, ${canAcceptApplications(RECRUITMENT.applications) ? 'one mailbox CV route' : 'no collection route'}.`);
