import assert from 'node:assert/strict';
import test from 'node:test';
import { inlineLegalTokens, isAllowedLegalHref, parseLegalBlocks, stableClauseId, stableHeadingId, stripLeadingH1 } from './legal-markdown.mjs';

test('stripLeadingH1 removes only a leading "# " line and surrounding blank lines', () => {
  assert.equal(stripLeadingH1('# Terms of Business\n\nVersion 1.0.\n'), 'Version 1.0.\n');
  assert.equal(stripLeadingH1('\n# Terms of Business\n\nVersion 1.0.\n'), 'Version 1.0.\n');
  assert.equal(stripLeadingH1('Version 1.0.\n\n# Not a heading here'), 'Version 1.0.\n\n# Not a heading here');
  assert.equal(stripLeadingH1('No heading at all'), 'No heading at all');
});

test('stableHeadingId: numbered clause headings, annexes, and a slugified fallback', () => {
  assert.equal(stableHeadingId('1. Who we are and how these terms apply'), 'clause-1');
  assert.equal(stableHeadingId('13. Non-solicitation'), 'clause-13');
  assert.equal(stableHeadingId('Annex 1. Description of the processing'), 'annex-1');
  assert.equal(stableHeadingId('Annex 3. Sub-processors'), 'annex-3');
  assert.equal(stableHeadingId('Version history'), 'version-history');
  assert.equal(stableHeadingId('How changes are notified'), 'how-changes-are-notified');
  assert.equal(stableHeadingId('Current sub-processors'), 'current-sub-processors');
});

test('stableClauseId: only two-level-or-deeper clause numbers get an id', () => {
  assert.equal(stableClauseId('1.1 We are FRESH PCS CONSULTANCY LTD...'), 'clause-1-1');
  assert.equal(stableClauseId('13.3 These terms are governed by...'), 'clause-13-3');
  assert.equal(stableClauseId('10.2 Certain sub-processors process...'), 'clause-10-2');
  assert.equal(stableClauseId('Version 1.0. Effective 14 September 2026.'), undefined);
  assert.equal(stableClauseId('This page is Annex 3 to our terms.'), undefined);
});

test('parseLegalBlocks: headings, paragraphs with clause ids, bullet lists, and tables', () => {
  const markdown = [
    '## 1. Parties and scope',
    '',
    '1.1 These terms apply between the parties.',
    '',
    '1.2 A second clause on its own line.',
    '',
    '### Access control',
    '',
    '- First measure.',
    '- Second measure.',
    '',
    '| Version | Effective date | Change |',
    '|---|---|---|',
    '| 1.0 | 14 September 2026 | First published version. |',
  ].join('\n');

  assert.deepEqual(parseLegalBlocks(markdown), [
    { type: 'heading', level: 2, text: '1. Parties and scope', id: 'clause-1' },
    { type: 'paragraph', text: '1.1 These terms apply between the parties.', id: 'clause-1-1' },
    { type: 'paragraph', text: '1.2 A second clause on its own line.', id: 'clause-1-2' },
    { type: 'heading', level: 3, text: 'Access control', id: 'access-control' },
    { type: 'list', items: ['First measure.', 'Second measure.'] },
    {
      type: 'table',
      header: ['Version', 'Effective date', 'Change'],
      rows: [['1.0', '14 September 2026', 'First published version.']],
    },
  ]);
});

test('parseLegalBlocks: a soft-wrapped paragraph (no blank line) joins into one block', () => {
  assert.deepEqual(parseLegalBlocks('9.2 The notification shall describe\nthe nature of the breach.'), [
    { type: 'paragraph', text: '9.2 The notification shall describe the nature of the breach.', id: 'clause-9-2' },
  ]);
});

test('parseLegalBlocks: a table with no matching separator row is left as paragraph text', () => {
  const blocks = parseLegalBlocks('| Not a table |\nJust a line after it.');
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'paragraph');
});

test('isAllowedLegalHref: a strict mailto shape is allowed alongside ordinary http(s)/internal links', () => {
  assert.equal(isAllowedLegalHref('mailto:hello@fresh-tech.uk'), true);
  assert.equal(isAllowedLegalHref('mailto:not an email'), false);
  assert.equal(isAllowedLegalHref('/terms-of-business'), true);
  assert.equal(isAllowedLegalHref('https://example.test'), true);
  assert.equal(isAllowedLegalHref('javascript:alert(1)'), false);
});

test('inlineLegalTokens: autolinks a bare email (GFM autolink literal, as remark-gfm renders it in production)', () => {
  assert.deepEqual(inlineLegalTokens('Email to hello@fresh-tech.uk is sufficient.'), [
    { type: 'text', value: 'Email to ' },
    { type: 'link', href: 'mailto:hello@fresh-tech.uk', external: false, children: [{ type: 'text', value: 'hello@fresh-tech.uk' }] },
    { type: 'text', value: ' is sufficient.' },
  ]);
});

test('inlineLegalTokens: an existing Markdown link and strong text still work as in inlineMarkdownTokens', () => {
  assert.deepEqual(inlineLegalTokens('Our [Data Processing Terms](/dpa) cover **this**.'), [
    { type: 'text', value: 'Our ' },
    { type: 'link', href: '/dpa', external: false, children: [{ type: 'text', value: 'Data Processing Terms' }] },
    { type: 'text', value: ' cover ' },
    { type: 'strong', value: 'this' },
    { type: 'text', value: '.' },
  ]);
});
