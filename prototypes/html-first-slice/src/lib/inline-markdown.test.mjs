import assert from 'node:assert/strict';
import test from 'node:test';
import { inlineMarkdownTokens, isAllowedInlineHref } from './inline-markdown.mjs';

test('tokenises strong text and internal and external links without producing HTML', () => {
  assert.deepEqual(inlineMarkdownTokens('Use **MFA**, read [our **guide**](/guide) or [vendor](https://example.test).'), [
    { type: 'text', value: 'Use ' },
    { type: 'strong', value: 'MFA' },
    { type: 'text', value: ', read ' },
    { type: 'link', href: '/guide', external: false, children: [{ type: 'text', value: 'our ' }, { type: 'strong', value: 'guide' }] },
    { type: 'text', value: ' or ' },
    { type: 'link', href: 'https://example.test', external: true, children: [{ type: 'text', value: 'vendor' }] },
    { type: 'text', value: '.' },
  ]);
});

test('leaves unmatched markers and HTML-shaped text as escaped text tokens', () => {
  assert.deepEqual(inlineMarkdownTokens('<script>x</script> **open'), [{ type: 'text', value: '<script>x</script> ' }, { type: 'text', value: '**open' }]);
});

test('accepts ordinary internal, fragment and valid HTTP links', () => {
  for (const href of ['/guides/mfa?from=case#steps', 'guides/mfa', './mfa', '../mfa', '#steps', '?from=case', 'http://example.test/guide', 'https://example.test/guide']) {
    assert.equal(isAllowedInlineHref(href), true, href);
    assert.equal(inlineMarkdownTokens(`[safe](${href})`)[0].type, 'link', href);
  }
});

test('renders unsafe link Markdown as escaped text', () => {
  for (const href of ['javascript:alert(1)', 'data:text/html,x', '//example.test/path', String.raw`\evil.test\path`, 'https://example.test/a b', `https://example.test/a\u0000b`]) {
    assert.equal(isAllowedInlineHref(href), false, JSON.stringify(href));
    const source = `[unsafe](${href})`;
    const tokens = inlineMarkdownTokens(source);
    assert.equal(tokens.some((token) => token.type === 'link'), false, JSON.stringify(href));
    assert.equal(tokens.map((token) => token.value).join(''), source, JSON.stringify(href));
  }
});
