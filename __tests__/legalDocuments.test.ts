import { describe, expect, it } from 'vitest';
import {
  parseLegalDocument,
  stableClauseId,
  stableHeadingId,
  versionPathPart,
} from '../utils/legalDocuments';

describe('legal document helpers', () => {
  it('parses front matter and reports unresolved placeholders with line numbers', () => {
    const source = `---\ntitle: Terms\nslug: terms\nsummary: Summary\nversion: "1.0"\neffective_date: "[DECIDE: YYYY-MM-DD]"\n---\n\n# Terms\n`;
    const document = parseLegalDocument(source, 'terms.md');
    expect(document.metadata.version).toBe('1.0');
    expect(document.placeholders).toEqual([{ token: '[DECIDE: YYYY-MM-DD]', line: 6 }]);
  });

  it.each([
    ['11.6 Liability', 'clause-11'],
    ['Annex 2. Security', 'annex-2'],
    ['Version history', 'version-history'],
  ])('creates stable heading anchors for %s', (heading, expected) => {
    expect(stableHeadingId(heading)).toBe(expected);
  });

  it('creates stable numbered clause anchors', () => {
    expect(stableClauseId('11.6 Subject to clause 11.4')).toBe('clause-11-6');
    expect(stableClauseId('Ordinary paragraph')).toBeUndefined();
    expect(versionPathPart('1.0')).toBe('v1-0');
  });
});
