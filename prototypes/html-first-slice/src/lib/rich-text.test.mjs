import assert from 'node:assert/strict';
import test from 'node:test';
import { inlineText, richTextBlocks, richTextInline } from './rich-text.mjs';

test('splits paragraphs on blank lines and keeps single line breaks inside a paragraph', () => {
  const blocks = richTextBlocks('**Heading**\n\nFirst line\nsecond line\n\n\nThird paragraph.');
  assert.deepEqual(blocks.map(block => block.type), ['p', 'p', 'p']);
  assert.deepEqual(blocks[0].lines, [[{ type: 'strong', value: 'Heading' }]]);
  assert.equal(blocks[1].lines.length, 2);
  assert.equal(inlineText(blocks[1].lines[1]), 'second line');
  assert.equal(inlineText(blocks[2].lines[0]), 'Third paragraph.');
  assert.deepEqual(richTextBlocks(''), []);
});

test('renders bullet and numbered paragraphs as lists with the marker stripped', () => {
  const [bullets, numbered, mixed] = richTextBlocks('- **Teams**: calls.\n• Second item\n\n1. First\n2. Second\n\n- not a list\nbecause this line has no marker');
  assert.equal(bullets.type, 'ul');
  assert.deepEqual(bullets.items[0], [{ type: 'strong', value: 'Teams' }, { type: 'text', value: ': calls.' }]);
  assert.equal(inlineText(bullets.items[1]), 'Second item');
  assert.equal(numbered.type, 'ol');
  assert.deepEqual(numbered.items.map(inlineText), ['First', 'Second']);
  // A paragraph with one unmarked line is an ordinary paragraph, as in React.
  assert.equal(mixed.type, 'p');
  assert.equal(inlineText(mixed.lines[0]), '- not a list');
});

test('inline precedence is links, then strong, then em, with plain link labels', () => {
  assert.deepEqual(richTextInline('See **our** [Managed **IT**](/services/managed-it-support) and *fast* [vendor](https://example.test).'), [
    { type: 'text', value: 'See ' }, { type: 'strong', value: 'our' }, { type: 'text', value: ' ' },
    { type: 'link', href: '/services/managed-it-support', external: false, label: 'Managed **IT**' },
    { type: 'text', value: ' and ' }, { type: 'em', value: 'fast' }, { type: 'text', value: ' ' },
    { type: 'link', href: 'https://example.test', external: true, label: 'vendor' },
    { type: 'text', value: '.' },
  ]);
  // The production regex treats any "**...**" pair as strong, whitespace included.
  assert.deepEqual(richTextInline('2 ** 3 and ** alone'), [
    { type: 'text', value: '2 ' }, { type: 'strong', value: ' 3 and ' }, { type: 'text', value: ' alone' },
  ]);
  assert.deepEqual(richTextInline('a * b'), [{ type: 'text', value: 'a * b' }]);
});

test('unsafe link targets stay as escaped text rather than becoming links', () => {
  for (const href of ['javascript:alert(1)', '//evil.test', 'data:text/plain,x']) {
    const tokens = richTextInline(`[bad](${href})`);
    assert.equal(tokens.some(token => token.type === 'link'), false, href);
    assert.equal(inlineText(tokens), `[bad](${href})`, href);
  }
});
