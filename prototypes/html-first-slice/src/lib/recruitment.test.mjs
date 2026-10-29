import test from 'node:test';
import assert from 'node:assert/strict';
import { RECRUITMENT, canAcceptApplications } from './recruitment.mjs';
test('only approved mailbox with both launch gates opens applications', () => {
 const valid=RECRUITMENT.applications;
 assert.equal(canAcceptApplications(valid),true);
 for(const listingUrl of [null,'','mailto:other@fresh-tech.uk','https://evil.example','mailto:jobs@fresh-tech.uk?bcc=other@example.com']) assert.equal(canAcceptApplications({...valid,listingUrl}),false);
 assert.equal(canAcceptApplications({...valid,open:false}),false);
 assert.equal(canAcceptApplications({...valid,privacyApproved:false}),false);
});
