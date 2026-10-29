import assert from 'node:assert/strict';
import test from 'node:test';
import { blockTokens } from '../../src/lib/blog-markdown.mjs';
import { decodeEntities, missingBodyText, renderedText } from './blog-rendered-text.mjs';

// Synthetic article shaped like the emitted BlogMarkdown.astro output.
const source = [
  '## Backups: **what** matters',
  '',
  'Use **strong** passwords, then `code`; it\'s "quoted" & <safe>.',
  'Second line of the same paragraph.',
  '',
  '- ✅ **Bold**, then punctuation!',
  '- 🇬🇧 UK only (flag)',
  '- 2 hours of downtime',
  '',
  '1. 1️⃣ Keycap first',
  '2. Call [us](tel:+441584517234) today.',
  '',
  '| Col | Val |',
  '|---|---|',
  '| **a** | b, c |',
].join('\n');

const rendered = [
  '<article class="blog-article">',
  '<h2>Backups: <strong>what</strong> matters</h2>',
  '<p>Use <strong>strong</strong> passwords, then <code>code</code>; it&#39;s &quot;quoted&quot; &amp; &lt;safe&gt;.\nSecond line of the same paragraph.</p>',
  '<ul><li><strong>Bold</strong>, then punctuation!</li><li>UK only (flag)</li><li>2 hours of downtime</li></ul>',
  '<ol><li>Keycap first</li><li>Call <a href="tel:+441584517234">us</a> today.</li></ol>',
  '<div class="blog-table-wrap"><table><thead><tr><th>Col</th><th>Val</th></tr></thead><tbody><tr><td><strong>a</strong></td><td>b, c</td></tr></tbody></table></div>',
  '</article>',
].join('');

test('renderedText keeps inline adjacency, separates blocks and decodes entities once', () => {
  assert.equal(renderedText('<p><strong>Bold</strong>, then<em>!</em></p>'), 'Bold, then!');
  assert.equal(renderedText('<p>one</p><p>two</p>'), 'one two');
  assert.equal(renderedText('<h2>Head</h2><ul><li>a</li><li>b</li></ul>'), 'Head a b');
  assert.equal(renderedText('<p>a<br>b</p>'), 'a b');
  assert.equal(renderedText('<p>&amp;lt; &#x2705; &#10004; it&#39;s&nbsp;here &amp; &quot;q&quot;</p>'), '&lt; ✅ ✔ it\'s here & "q"');
  assert.equal(renderedText('<p>x</p><script>ignored()</script><style>.y{}</style><svg><title>no</title></svg><p>z</p>'), 'x z');
  assert.equal(decodeEntities('&unknown; &#xZZ;'), '&unknown; &#xZZ;');
});

test('content parity passes for bold followed by punctuation, entities and the list-item emoji rule', () => {
  assert.deepEqual(missingBodyText(rendered, blockTokens(source)), []);
});

test('content parity still fails for genuinely missing or altered text', () => {
  const blocks = blockTokens(source);
  const dropped = missingBodyText(rendered.replace('Second line of the same paragraph.', ''), blocks);
  assert.equal(dropped.length, 1);
  assert.equal(dropped[0].type, 'p');
  const wordRemoved = missingBodyText(rendered.replace('then punctuation!', 'punctuation!'), blocks);
  assert.deepEqual(wordRemoved.map(item => item.type), ['ul']);
  const cellChanged = missingBodyText(rendered.replace('b, c', 'b c'), blocks);
  assert.deepEqual(cellChanged.map(item => item.type), ['table']);
  // Element and list-item counts are checked separately by blog-output-check.
});

test('the old tag-to-space extraction is what produced the false failures', () => {
  const naive = rendered.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.equal(naive.includes('Bold, then punctuation!'), false);
  assert.equal(renderedText(rendered).includes('Bold, then punctuation!'), true);
});
