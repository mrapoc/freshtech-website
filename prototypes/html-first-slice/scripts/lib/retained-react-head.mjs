// Retained production baselines: the frozen React /services/managed-it-support
// head (test-fixtures/managed-service-react-head.json) and the standalone page
// captures under test-fixtures/standalone/. Every gate that compares native
// output against one must apply the same documented substitutions, or a
// deliberate copy change fails one gate and passes another. Kept in one place
// for that reason, like the shared proof-endpoint list. Re-capture with
// scripts/capture-retained-head.mjs only when the React reference is rebuilt.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { replaceRetiredSocialImage } from '../../src/lib/social-image.mjs';

const FIXTURE = new URL('../../test-fixtures/managed-service-react-head.json', import.meta.url);

// Deliberate copy changes made after the capture, as [captured, current] pairs.
// Add a pair here when shipped copy changes; do not edit the capture itself.
export const RETAINED_COPY_SUBSTITUTIONS = Object.freeze([
  // October 2026 positioning change: onsite visits are billed separately, so
  // "Fast onsite response" is no longer true on the React or the native page.
  ['Fast onsite response', 'Fast remote response'],
]);

// Applies the documented substitutions to the fixture's serialised JSON. The
// retired social image is handled by src/lib/social-image.mjs; nothing else is
// rewritten, so every other captured value is still compared byte for byte.
export const substituteRetainedHead = text =>
  RETAINED_COPY_SUBSTITUTIONS.reduce(
    (acc, [from, to]) => acc.split(from).join(to),
    replaceRetiredSocialImage(text),
  );

export const loadRetainedReactHead = async () =>
  JSON.parse(substituteRetainedHead(await readFile(fileURLToPath(FIXTURE), 'utf8')));
