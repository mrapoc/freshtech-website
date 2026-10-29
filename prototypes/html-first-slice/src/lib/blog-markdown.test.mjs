import assert from 'node:assert/strict';
import test from 'node:test';
import { SMALL_HEADING, SMALL_HEADING_CLASS, blockTokens, hasList, hasTable, inlineTokens, isAllowedBlogHref, stripLeadingListEmoji, visibleText } from './blog-markdown.mjs';

test('inline: links first, then bold and code inside the remaining text; labels stay plain', () => {
  const tokens = inlineTokens('Start **bold** `code` [**label**](/contact) and [ext](https://example.com/x) end');
  assert.deepEqual(tokens, [
    { type: 'text', value: 'Start ' }, { type: 'strong', value: 'bold' }, { type: 'text', value: ' ' }, { type: 'code', value: 'code' }, { type: 'text', value: ' ' },
    { type: 'link', href: '/contact', external: false, label: '**label**' },
    { type: 'text', value: ' and ' },
    { type: 'link', href: 'https://example.com/x', external: true, label: 'ext' },
    { type: 'text', value: ' end' },
  ]);
});

test('inline: unmatched markers and unsafe hrefs stay literal text', () => {
  assert.deepEqual(inlineTokens('a **b'), [{ type: 'text', value: 'a ' }, { type: 'text', value: '**b' }]);
  assert.deepEqual(inlineTokens('a `b'), [{ type: 'text', value: 'a ' }, { type: 'text', value: '`b' }]);
  // The link regex stops at the first ")" so the source splits into two text
  // tokens; what matters is that the rendered text is the literal source and
  // no link token is ever emitted.
  for (const unsafe of ['[x](javascript:alert(1))', '[x](//evil.test/x)', '[x](data:text/plain,x)', '[x](vbscript:x)', '[x](tel:+44 1584 517234)', '[x](mailto:a@b.test?subject=x)']) {
    const tokens = inlineTokens(unsafe);
    assert.equal(visibleText(tokens), unsafe);
    assert.ok(tokens.every(token => token.type === 'text'), `no link token for ${unsafe}`);
  }
  assert.deepEqual(inlineTokens('[x](#section)'), [{ type: 'link', href: '#section', external: false, label: 'x' }]);
  assert.deepEqual(inlineTokens('[call](tel:+441584517234)'), [{ type: 'link', href: 'tel:+441584517234', external: false, label: 'call' }]);
  assert.deepEqual(inlineTokens('[mail](mailto:hello@example.com)'), [{ type: 'link', href: 'mailto:hello@example.com', external: false, label: 'mail' }]);
  assert.deepEqual(inlineTokens('<b>not html</b>'), [{ type: 'text', value: '<b>not html</b>' }]);
  assert.deepEqual(inlineTokens(''), []);
});

test('href: strict tel and mailto are allowed on top of the shared http(s) rules; nothing else widens', () => {
  for (const href of ['tel:+441584517234', 'tel:01584517234', 'mailto:hello@example.com', 'mailto:first.last+tag@sub.example.co.uk', '/contact', '#anchor', 'https://example.com/x?y=1']) {
    assert.equal(isAllowedBlogHref(href), true, href);
  }
  for (const href of [
    'javascript:alert(1)', 'JavaScript:alert(1)', '//evil.test/x', 'data:text/plain,x', 'vbscript:x', 'file:///etc/passwd',
    'tel:', 'tel:+44', 'tel:+44 1584 517234', 'tel:+44-1584-517234', 'tel:+441584517234;ext=1', 'tel:javascript:alert(1)',
    'mailto:', 'mailto:hello', 'mailto:hello@example.com?subject=x', 'mailto:a@b.test,c@d.test', 'mailto:"x"@example.com', 'mailto:hello@example',
    'tel:+441584517234\n', ' tel:+441584517234', '', null, undefined, 42,
  ]) {
    assert.equal(isAllowedBlogHref(href), false, String(href));
  }
});

test('blocks: headings, paragraphs, lists and tables follow the V2 renderer', () => {
  const content = [
    '## Heading **two**', '', 'Para line one', 'line two', '', '### Third', '', '* one', '- two', '', '1. first', '2. second', 'Not a list',
    '', '| Col A | Col B |', '|---|---|', '| a1 | **a2** |', '| b1 |', '', '| just | pipes |',
  ].join('\n');
  const blocks = blockTokens(content);
  assert.deepEqual(blocks.map(block => block.type), ['h2', 'p', 'h3', 'ul', 'ol', 'p', 'table', 'p']);
  assert.equal(visibleText(blocks[0].children), 'Heading two');
  assert.equal(visibleText(blocks[1].children), 'Para line one\nline two');
  assert.deepEqual(blocks[3].items.map(visibleText), ['one', 'two']);
  assert.deepEqual(blocks[4].items.map(visibleText), ['first', 'second']);
  assert.equal(visibleText(blocks[5].children), 'Not a list');
  assert.deepEqual(blocks[6].header.map(visibleText), ['Col A', 'Col B']);
  assert.deepEqual(blocks[6].rows.map(row => row.map(visibleText)), [['a1', 'a2'], ['b1']]);
  assert.equal(blocks[6].rows[0][1][0].type, 'strong');
  assert.equal(visibleText(blocks[7].children), '| just | pipes |');
  assert.equal(hasTable(content), true);
  assert.equal(hasList(content), true);
  assert.equal(hasTable('plain'), false);
  assert.equal(hasList('plain'), false);
});

test('list items: only a leading decorative emoji grapheme is dropped; words, punctuation and later emoji are kept', () => {
  // Documented mechanical formatting exception: emoji-led lists are forbidden
  // by the site style, so the first grapheme goes when it is an emoji cluster.
  assert.equal(stripLeadingListEmoji('✅ Backups tested weekly.'), 'Backups tested weekly.');
  assert.equal(stripLeadingListEmoji('✔️ Tick with variation selector'), 'Tick with variation selector');
  assert.equal(stripLeadingListEmoji('🇬🇧 UK data residency'), 'UK data residency');
  assert.equal(stripLeadingListEmoji('👨‍👩‍👧 Family plan (ZWJ sequence)'), 'Family plan (ZWJ sequence)');
  assert.equal(stripLeadingListEmoji('👍🏽 Skin tone modifier'), 'Skin tone modifier');
  assert.equal(stripLeadingListEmoji('1️⃣ Keycap one'), 'Keycap one');
  assert.equal(stripLeadingListEmoji('❌\tTab separated'), 'Tab separated');
  // Interior emoji, punctuation and formatting are untouched.
  assert.equal(stripLeadingListEmoji('🔒 **Encrypt** laptops, phones — and USB sticks 🔑!'), '**Encrypt** laptops, phones — and USB sticks 🔑!');
  assert.equal(stripLeadingListEmoji('Costs 🚀 rise'), 'Costs 🚀 rise');
  // Ordinary text, numerals and symbols that are not emoji are left alone.
  for (const plain of ['2 hours of downtime', '3. Numbered text', '#hashtag first', '* literal star', 'Plain item', ' leading space', '', '£99 per month', '(1) bracketed', 'Café ☕ later']) {
    assert.equal(stripLeadingListEmoji(plain), plain);
  }
  assert.equal(stripLeadingListEmoji('✅'), '');
});

test('blocks: the list-item emoji rule is applied in blockTokens only, so parity derives the same text', () => {
  const blocks = blockTokens(['## ✅ Heading keeps it', '', '✅ Paragraph keeps it', '', '- ✅ **Bold** item, punctuated.', '* 🇬🇧 Flag item', '- Plain 2 item', '', '1. 1️⃣ Keycap first', '2. 2 hours', '', '| ✅ Head | x |', '|---|---|', '| ✅ cell | y |'].join('\n'));
  assert.equal(visibleText(blocks[0].children), '✅ Heading keeps it');
  assert.equal(visibleText(blocks[1].children), '✅ Paragraph keeps it');
  assert.deepEqual(blocks[2].items.map(visibleText), ['Bold item, punctuated.', 'Flag item', 'Plain 2 item']);
  assert.equal(blocks[2].items[0][0].type, 'strong');
  assert.deepEqual(blocks[3].items.map(visibleText), ['Keycap first', '2 hours']);
  assert.deepEqual(blocks[4].header.map(visibleText), ['✅ Head', 'x']);
  assert.deepEqual(blocks[4].rows.map(row => row.map(visibleText)), [['✅ cell', 'y']]);
});

test('headings: an article with no ## gets peer H2s for every ### heading, text untouched, small presentation marked', () => {
  const blocks = blockTokens(['### First **point**', '', 'Para', '', '### Second point', '', '* item', '', '### Third'].join('\n'));
  assert.deepEqual(blocks.map(block => block.type), ['h2', 'p', 'h2', 'ul', 'h2']);
  const headings = blocks.filter(block => block.type === 'h2');
  assert.ok(headings.every(block => block.presentation === SMALL_HEADING), 'every promoted heading carries the small presentation marker');
  assert.deepEqual(headings.map(block => visibleText(block.children)), ['First point', 'Second point', 'Third']);
  assert.equal(headings[0].children[1].type, 'strong', 'inline tokens of a promoted heading are unchanged');
  assert.ok(!blocks.some(block => block.type === 'h3'), 'no H3 survives without a preceding H2');
  assert.equal(typeof SMALL_HEADING_CLASS, 'string');
  assert.ok(SMALL_HEADING_CLASS.length > 0);
});

test('headings: ### before the first ## becomes H2; ### after a real ## stays H3', () => {
  const blocks = blockTokens(['### Orphan one', '', '### Orphan two', '', '## Real section', '', '### Nested under real', '', 'Para', '', '## Another section', '', '### Nested again'].join('\n'));
  assert.deepEqual(blocks.map(block => block.type), ['h2', 'h2', 'h2', 'h3', 'p', 'h2', 'h3']);
  assert.deepEqual(blocks.map(block => block.presentation ?? null), [SMALL_HEADING, SMALL_HEADING, null, null, null, null, null]);
  assert.deepEqual(blocks.filter(block => block.type !== 'p').map(block => visibleText(block.children)), ['Orphan one', 'Orphan two', 'Real section', 'Nested under real', 'Another section', 'Nested again']);
  // Once promoted, the outline never skips: each heading is at most one level deeper than the previous.
  const levels = blocks.filter(block => block.type === 'h2' || block.type === 'h3').map(block => Number(block.type[1]));
  assert.ok(levels.every((level, index) => index === 0 ? level === 2 : level <= levels[index - 1] + 1));
});

test('headings: a normal ## then ### article is emitted exactly as before, with no presentation marker', () => {
  const blocks = blockTokens(['## Section', '', '### Sub', '', 'Para', '', '## Section two', '', '### Sub two'].join('\n'));
  assert.deepEqual(blocks.map(block => block.type), ['h2', 'h3', 'p', 'h2', 'h3']);
  assert.ok(blocks.every(block => !('presentation' in block)), 'no marker when the source hierarchy is already valid');
  assert.deepEqual(blocks[0], { type: 'h2', children: [{ type: 'text', value: 'Section' }] });
  assert.deepEqual(blocks[1], { type: 'h3', children: [{ type: 'text', value: 'Sub' }] });
});

test('blocks: CRLF input and a lone table header degrade exactly as the V2 renderer', () => {
  assert.deepEqual(blockTokens('a\r\n\r\nb').map(block => visibleText(block.children)), ['a', 'b']);
  const [lone] = blockTokens('|---|');
  assert.equal(lone.type, 'p');
});
