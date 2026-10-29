import assert from 'node:assert/strict';
import test from 'node:test';
import { readTeamMembers } from './team-reader.mjs';

// Synthetic records only; shapes follow data/content.ts teamMembers.
const member = (slug, overrides = {}) => {
  const fields = {
    name: "'Test Person'", shortName: `'${slug.split('-')[0]}'`, slug: `'${slug}'`, role: "'Engineer'", power: "'The Tester'",
    bio: "'Short bio.'", extendedBio: "'Longer bio.'", expertise: "['Networking', 'Hardware']",
    imgMasked: "'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/a.png'", imgUnmasked: "'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/b.png?v=2'",
    linkedin: "'https://www.linkedin.com/in/test-person/'", ...overrides,
  };
  return `{ ${Object.entries(fields).filter(([, value]) => value !== undefined).map(([key, value]) => `${key}: ${value}`).join(', ')} }`;
};
const source = body => `export const teamMembers = [${body}];`;

test('reads members in source order with every field, allowing an empty LinkedIn', () => {
  const members = readTeamMembers('fixture.ts', source(`${member('ann-one')}, ${member('bob-two', { linkedin: "''" })}`));
  assert.deepEqual(members.map(item => item.slug), ['ann-one', 'bob-two']);
  assert.equal(members[1].linkedin, '');
  assert.deepEqual(members[0].expertise, ['Networking', 'Hardware']);
});

test('rejects unsafe or malformed records', () => {
  assert.throws(() => readTeamMembers('fixture.ts', source(member('Bad Slug'))), /safe route segment/);
  assert.throws(() => readTeamMembers('fixture.ts', source(member('ann-one', { linkedin: "'javascript:alert(1)'" }))), /LinkedIn profile URL/);
  assert.throws(() => readTeamMembers('fixture.ts', source(member('ann-one', { imgUnmasked: "'http://example.com/a.png'" }))), /Cloudinary image URL/);
  assert.throws(() => readTeamMembers('fixture.ts', source(member('ann-one', { power: undefined }))), /missing field power/);
  assert.throws(() => readTeamMembers('fixture.ts', source(`${member('ann-one')}, ${member('ann-one')}`)), /Duplicate team slug/);
  assert.throws(() => readTeamMembers('fixture.ts', source(`${member('ann-one')}, ${member('ann-two')}`)), /Duplicate team shortName/);
});
