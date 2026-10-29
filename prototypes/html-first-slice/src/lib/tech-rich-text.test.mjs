import assert from 'node:assert/strict';
import test from 'node:test';
import { blockTextPieces, blockTokens, inlineTokens, visibleText } from './tech-rich-text.mjs';

test('splits paragraphs on blank lines and keeps single newlines as line breaks', () => {
  const blocks = blockTokens('First line.\nSecond line.\n\nNext paragraph.');
  assert.deepEqual(blocks.map(block => block.type), ['p', 'p']);
  assert.deepEqual(blocks[0].lines.map(visibleText), ['First line.', 'Second line.']);
  assert.deepEqual(blocks[1].lines.map(visibleText), ['Next paragraph.']);
  assert.deepEqual(blockTokens(''), []);
});

test('renders bullet and numbered lists only when every line is a list line', () => {
  const [bullets] = blockTokens('- one\n• two\n\n');
  assert.equal(bullets.type, 'ul');
  assert.deepEqual(bullets.items.map(visibleText), ['one', 'two']);
  const [numbered] = blockTokens('1. first\n2. second');
  assert.equal(numbered.type, 'ol');
  assert.deepEqual(numbered.items.map(visibleText), ['first', 'second']);
  // RichText.tsx: a lead-in line followed by "- " lines is a paragraph with <br>s and the dashes kept.
  const [mixed] = blockTokens('Gives you:\n- **Offline sync.** Works offline.');
  assert.equal(mixed.type, 'p');
  assert.deepEqual(mixed.lines.map(visibleText), ['Gives you:', '- Offline sync. Works offline.']);
  assert.deepEqual(mixed.lines[1][0], { type: 'text', value: '- ' });
  assert.deepEqual(mixed.lines[1][1], { type: 'strong', value: 'Offline sync.' });
});

test('tokenises links first, then strong, then emphasis', () => {
  assert.deepEqual(inlineTokens('See **bold** and *italic* and [our service](/services/rmm) or [docs](https://example.com/x).'), [
    { type: 'text', value: 'See ' }, { type: 'strong', value: 'bold' }, { type: 'text', value: ' and ' }, { type: 'em', value: 'italic' }, { type: 'text', value: ' and ' },
    { type: 'link', href: '/services/rmm', external: false, label: 'our service' }, { type: 'text', value: ' or ' },
    { type: 'link', href: 'https://example.com/x', external: true, label: 'docs' }, { type: 'text', value: '.' },
  ]);
  assert.deepEqual(inlineTokens('**Bold label:** text'), [{ type: 'strong', value: 'Bold label:' }, { type: 'text', value: ' text' }]);
  assert.deepEqual(inlineTokens('a * b'), [{ type: 'text', value: 'a * b' }]);
  assert.deepEqual(inlineTokens(''), []);
});

test('renders disallowed link targets as literal text rather than links', () => {
  // The non-greedy link split may emit the source as adjacent text tokens
  // (e.g. "javascript:alert(1)" splits at the first ")"), so assert the
  // reconstructed visible text and that no token is a link, not the grouping.
  for (const href of ['javascript:alert(1)', '//evil.test/x', 'data:text/html,1', 'vbscript:x', 'mailto:x@y.z']) {
    const tokens = inlineTokens(`[click](${href})`);
    assert.ok(tokens.length > 0);
    assert.ok(tokens.every(token => token.type === 'text'), `unexpected non-text token for ${href}`);
    assert.equal(visibleText(tokens), `[click](${href})`);
  }
});

test('visible text pieces follow the rendered blocks', () => {
  assert.deepEqual(blockTextPieces('Intro [x](/y).\n\n- **a** one\n- b\n\n1. first'), ['Intro x.', 'a one', 'b', 'first']);
});
