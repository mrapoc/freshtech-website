import assert from 'node:assert/strict';
import test from 'node:test';
import { HEADING_TAG, blockHtml, blockTokens, escapeHtml, hasList, hasSubheading, inlineHtml, inlineTokens, isSubheadingLine, renderGuideContent, visibleText } from './guide-markdown.mjs';

test('inline: **runs** become strong; unmatched, starred or empty markers stay literal text', () => {
  assert.deepEqual(inlineTokens('Start **bold** end'), [{ type: 'text', value: 'Start ' }, { type: 'strong', value: 'bold' }, { type: 'text', value: ' end' }]);
  assert.deepEqual(inlineTokens('**Label:** rest'), [{ type: 'strong', value: 'Label:' }, { type: 'text', value: ' rest' }]);
  assert.deepEqual(inlineTokens('**a** and **b**'), [{ type: 'strong', value: 'a' }, { type: 'text', value: ' and ' }, { type: 'strong', value: 'b' }]);
  assert.deepEqual(inlineTokens('a **b'), [{ type: 'text', value: 'a **b' }]);
  assert.deepEqual(inlineTokens('a **b*c** d'), [{ type: 'text', value: 'a **b*c** d' }], 'a star inside a run is not bold in the source renderer');
  assert.deepEqual(inlineTokens('****'), [{ type: 'text', value: '****' }]);
  assert.deepEqual(inlineTokens('**'), [{ type: 'text', value: '**' }]);
  assert.deepEqual(inlineTokens('27"+ 4K IPS panel'), [{ type: 'text', value: '27"+ 4K IPS panel' }]);
  assert.deepEqual(inlineTokens(''), []);
  assert.deepEqual(inlineTokens(undefined), []);
  assert.equal(visibleText(inlineTokens('x **y** z')), 'x y z');
});

test('inline: markdown links, inline code and raw HTML are not constructs; they are literal text', () => {
  for (const literal of ['[label](/contact)', '[x](https://example.com)', '[x](javascript:alert(1))', '`code`', '<b>bold</b>', '<a href="/x">y</a>', '## Heading', '* star bullet']) {
    assert.deepEqual(inlineTokens(literal), [{ type: 'text', value: literal }], literal);
  }
});

test('blocks: a section in the source style tokenises to paragraphs, h3 subheadings and semantic lists', () => {
  const content = [
    'Your workstation is the heart of productivity.', '',
    '**Minimum Specs (2025):**', '• CPU: 8+ cores', '• RAM: **32GB** DDR5', '',
    '**Why It Matters:**', 'Certified cards are tested.', 'Second paragraph line.', '',
    '**The 5 Controls:**', '1. Firewalls', '2. Secure Configuration', '3. Access Control', '',
    '**The Solution: Network Segmentation**', 'Create isolated VLANs:', '- VLAN 1: Office', '- VLAN 2: Production',
  ].join('\n');
  const blocks = blockTokens(content);
  assert.deepEqual(blocks.map(block => block.type), ['p', 'h3', 'ul', 'h3', 'p', 'p', 'h3', 'ol', 'h3', 'p', 'ul']);
  assert.deepEqual(blocks[1], { type: 'h3', children: [{ type: 'text', value: 'Minimum Specs (2025):' }] });
  assert.deepEqual(blocks[2].items.map(visibleText), ['CPU: 8+ cores', 'RAM: 32GB DDR5']);
  assert.equal(blocks[2].items[1][1].type, 'strong');
  assert.equal(visibleText(blocks[4].children), 'Certified cards are tested.');
  assert.equal(visibleText(blocks[5].children), 'Second paragraph line.', 'paragraphs stay one per source line');
  assert.equal(blocks[7].start, 1);
  assert.deepEqual(blocks[7].items.map(item => [item.number, visibleText(item.children)]), [[1, 'Firewalls'], [2, 'Secure Configuration'], [3, 'Access Control']]);
  assert.equal(visibleText(blocks[8].children), 'The Solution: Network Segmentation');
  assert.deepEqual(blocks[10].items.map(visibleText), ['VLAN 1: Office', 'VLAN 2: Production']);
  assert.equal(hasList(content), true);
  assert.equal(hasSubheading(content), true);
  assert.equal(hasList('plain'), false);
  assert.equal(hasSubheading('plain'), false);
});

test('headings: only a whole-line single bold run is a subheading; the order of checks matches the source renderer', () => {
  assert.equal(isSubheadingLine('**Heading:**'), true);
  assert.equal(isSubheadingLine('**A** and **B**'), false);
  assert.equal(isSubheadingLine('**Label:** rest'), false);
  assert.equal(isSubheadingLine('**Heading** '), false, 'trailing space breaks the endsWith check exactly as in React');
  assert.equal(isSubheadingLine('**'), false);
  assert.equal(isSubheadingLine('***'), false);
  assert.equal(isSubheadingLine('****'), false);
  assert.equal(isSubheadingLine('** **'), false);
  assert.equal(isSubheadingLine('**a*b**'), true, 'a single star inside is still one run for the heading check');
  assert.deepEqual(blockTokens('**A** and **B**').map(block => block.type), ['p']);
  assert.deepEqual(blockTokens('- **Bold item**')[0], { type: 'ul', items: [[{ type: 'strong', value: 'Bold item' }]] });
  assert.deepEqual(blockTokens('1. **Bold step**')[0], { type: 'ol', start: 1, items: [{ number: 1, children: [{ type: 'strong', value: 'Bold step' }] }] });
  // Empty bold lines are paragraphs rather than empty headings. Their inline
  // tokens follow the source regex: "**" and "***" cannot match a run and stay
  // literal; "** **" is a whitespace-only strong run, exactly as parseBold in
  // the React page renders it. The no-empty-heading contract holds either way.
  assert.deepEqual(blockTokens('**'), [{ type: 'p', children: [{ type: 'text', value: '**' }] }]);
  assert.deepEqual(blockTokens('***'), [{ type: 'p', children: [{ type: 'text', value: '***' }] }]);
  assert.deepEqual(blockTokens('** **'), [{ type: 'p', children: [{ type: 'strong', value: ' ' }] }]);
  assert.equal(renderGuideContent('** **'), '<p><strong> </strong></p>');
  assert.equal(HEADING_TAG, 'h3');
  assert.ok(!blockTokens('**A**\n\n**B**').some(block => block.type === 'h2' || block.type === 'h4'), 'subheadings never escape the h3 level');
});

test('lists: bullet markers, numbering, grouping and near-misses follow the source renderer line by line', () => {
  assert.deepEqual(blockTokens('• a\n- b\n• c').map(block => block.type), ['ul'], 'both bullet markers join one list');
  assert.deepEqual(blockTokens('• a\n\n• b').map(block => block.type), ['ul', 'ul'], 'a blank line splits lists');
  assert.deepEqual(blockTokens('• a\n1. b\n• c').map(block => block.type), ['ul', 'ol', 'ul'], 'switching marker type starts a new list');
  assert.deepEqual(blockTokens('• a\nplain\n• b').map(block => block.type), ['ul', 'p', 'ul']);
  assert.deepEqual(blockTokens('• a\n**H**\n• b').map(block => block.type), ['ul', 'h3', 'ul']);
  const numbered = blockTokens('3. three\n5. five\n10. ten')[0];
  assert.deepEqual(numbered, { type: 'ol', start: 3, items: [{ number: 3, children: [{ type: 'text', value: 'three' }] }, { number: 5, children: [{ type: 'text', value: 'five' }] }, { number: 10, children: [{ type: 'text', value: 'ten' }] }] });
  assert.deepEqual(blockTokens('1.  double space')[0].items[0].children, [{ type: 'text', value: 'double space' }]);
  for (const notAList of ['1.no space', '1.', '1. ', '  • indented', ' - indented', '•no space', '-no space', 'a. lettered', '1) paren']) {
    assert.deepEqual(blockTokens(notAList).map(block => block.type), ['p'], JSON.stringify(notAList));
    assert.equal(visibleText(blockTokens(notAList)[0].children), notAList);
  }
  assert.deepEqual(blockTokens('• ')[0], { type: 'ul', items: [[]] }, 'an empty bullet is an empty item, as in React');
});

test('blank lines: spacing only; whitespace-only lines are dropped and CRLF is normalised', () => {
  assert.deepEqual(blockTokens(''), []);
  assert.deepEqual(blockTokens('\n\n   \n\t\n'), []);
  assert.deepEqual(blockTokens('a\r\n\r\nb').map(block => visibleText(block.children)), ['a', 'b']);
  assert.deepEqual(blockTokens('a\r\n• b\r\n• c').map(block => block.type), ['p', 'ul']);
  assert.deepEqual(blockTokens(null), []);
});

test('escaping: every character of source text is escaped; only the fixed tag set is emitted', () => {
  assert.equal(escapeHtml('<a href="x">Tom & Jerry\'s</a>'), '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;');
  assert.equal(escapeHtml('&amp;'), '&amp;amp;', 'no double-unescaping: entities in source are literal');
  assert.equal(renderGuideContent('<script>alert(1)</script>'), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  assert.equal(renderGuideContent('**<b>x</b>**'), `<${HEADING_TAG}>&lt;b&gt;x&lt;/b&gt;</${HEADING_TAG}>`);
  assert.equal(renderGuideContent('See **<img src=x onerror=alert(1)>** now'), '<p>See <strong>&lt;img src=x onerror=alert(1)&gt;</strong> now</p>');
  assert.equal(renderGuideContent('• <li>fake</li>'), '<ul><li>&lt;li&gt;fake&lt;/li&gt;</li></ul>');
  assert.equal(renderGuideContent('1. </ol><script>'), '<ol><li>&lt;/ol&gt;&lt;script&gt;</li></ol>');
  assert.equal(renderGuideContent('[click](javascript:alert(1))'), '<p>[click](javascript:alert(1))</p>');
  assert.equal(renderGuideContent('[docs](https://example.com)'), '<p>[docs](https://example.com)</p>', 'links are never generated');
  assert.equal(renderGuideContent('27"+ 4K \'IPS\''), '<p>27&quot;+ 4K &#39;IPS&#39;</p>');
  assert.equal(renderGuideContent('£1,500 vs £2,500 & more'), '<p>£1,500 vs £2,500 &amp; more</p>');
  assert.equal(renderGuideContent('a b'), '<p>a b</p>', 'no other characters are rewritten');
  const html = renderGuideContent(['**Heading <1>**', '', 'Para "quoted"', '• item & co', '', '1. first', '2. second'].join('\n'));
  assert.equal(html, [
    `<${HEADING_TAG}>Heading &lt;1&gt;</${HEADING_TAG}>`,
    '<p>Para &quot;quoted&quot;</p>',
    '<ul><li>item &amp; co</li></ul>',
    '<ol><li>first</li><li>second</li></ol>',
  ].join('\n'));
  assert.ok(!/<(?!\/?(?:h3|p|ul|ol|li|strong)\b)/.test(html), 'no tag outside the fixed set');
});

test('html: ordered lists carry source numbering through start and value only when needed', () => {
  assert.equal(renderGuideContent('1. a\n2. b\n3. c'), '<ol><li>a</li><li>b</li><li>c</li></ol>');
  assert.equal(renderGuideContent('3. a\n4. b'), '<ol start="3"><li>a</li><li>b</li></ol>');
  assert.equal(renderGuideContent('1. a\n3. b\n4. c\n9. d'), '<ol><li>a</li><li value="3">b</li><li>c</li><li value="9">d</li></ol>');
  assert.equal(renderGuideContent('2. a\n1. b'), '<ol start="2"><li>a</li><li value="1">b</li></ol>');
  assert.equal(renderGuideContent('007. a'), '<ol start="7"><li>a</li></ol>');
  assert.equal(inlineHtml(inlineTokens('x **y** z')), 'x <strong>y</strong> z');
  assert.throws(() => blockHtml({ type: 'table' }), /Unknown guide block type table/);
});
