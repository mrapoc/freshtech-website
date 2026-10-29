import { assertArray, assertExactKeys, assertPlainObject, assertString, parseSource, topLevelConstLiteral } from './literal-reader.mjs';

// Fail-closed projection of data/content.ts `teamMembers` onto the fields
// pages/AuthorPage.tsx renders at /team/:slug (imgMasked is carried for parity
// of the record shape but only imgUnmasked is shown). Source order preserved.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const FIELDS = ['name', 'shortName', 'slug', 'role', 'power', 'bio', 'extendedBio', 'expertise', 'imgMasked', 'imgUnmasked', 'linkedin'];
const CLOUDINARY_IMAGE = /^https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\/[^\s"'<>]+$/;
const LINKEDIN = /^https:\/\/www\.linkedin\.com\/in\/[A-Za-z0-9_-]+\/?$/;

export function readTeamMembers(fileName, source) {
  const file = parseSource(fileName, source);
  const entries = assertArray(topLevelConstLiteral(file, 'teamMembers'), 'teamMembers');
  const slugs = new Set();
  const shortNames = new Set();
  return entries.map((entry, index) => {
    const label = `teamMembers[${index}]`;
    assertPlainObject(entry, label);
    assertExactKeys(entry, FIELDS, label);
    const member = {};
    for (const field of FIELDS.filter(name => !['expertise', 'linkedin'].includes(name))) member[field] = assertString(entry[field], `${label}.${field}`);
    member.expertise = assertArray(entry.expertise, `${label}.expertise`).map((skill, skillIndex) => assertString(skill, `${label}.expertise[${skillIndex}]`));
    // An empty string is the source's "no profile" value; anything else must be a LinkedIn profile URL.
    if (typeof entry.linkedin !== 'string' || (entry.linkedin !== '' && !LINKEDIN.test(entry.linkedin))) throw new Error(`${label}.linkedin must be empty or a LinkedIn profile URL`);
    member.linkedin = entry.linkedin;
    if (!SLUG_PATTERN.test(member.slug)) throw new Error(`${label}.slug is not a safe route segment`);
    for (const field of ['imgMasked', 'imgUnmasked']) if (!CLOUDINARY_IMAGE.test(member[field])) throw new Error(`${label}.${field} must be an HTTPS Cloudinary image URL`);
    if (slugs.has(member.slug)) throw new Error(`Duplicate team slug ${member.slug}`);
    if (shortNames.has(member.shortName)) throw new Error(`Duplicate team shortName ${member.shortName}`);
    slugs.add(member.slug);
    shortNames.add(member.shortName);
    return Object.fromEntries(FIELDS.map(field => [field, member[field]]));
  });
}
