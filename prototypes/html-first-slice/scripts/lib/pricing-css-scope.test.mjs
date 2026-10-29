import assert from 'node:assert/strict';
import test from 'node:test';
import { assertPricingCssScoped } from './pricing-css-scope.mjs';

const css = rules => `
.pricing-page .fine-print { color: white; }
/* Complete pricing route */
${rules}
@media (min-width: 768px) {
  .cs-hero .service-hero-grid { display: grid; }
}`;

test('accepts scoped multiline selectors through nested media rules', () => {
  assert.doesNotThrow(() => assertPricingCssScoped(css(`
.pricing-page .one,
.pricing-page .two { color: black; }
@media (min-width: 1024px) {
  .pricing-page .three { display: grid; }
}`)));
});

test('rejects an unscoped selector hidden on a continued line', () => {
  assert.throws(
    () => assertPricingCssScoped(css('.pricing-page .one,\n.leaked-selector,\n.pricing-page .two { color: black; }')),
    /not route-scoped: \.leaked-selector/,
  );
});

test('rejects an unscoped selector after a comment', () => {
  assert.throws(
    () => assertPricingCssScoped(css('/* Looks harmless. */ .leaked-after-comment { color: black; }')),
    /not route-scoped: \.leaked-after-comment/,
  );
});

const standaloneCss = rules => `
.pricing-page .fine-print { color: white; }
/* Complete pricing route */
${rules}`;

test('standalone: accepts a scoped block that runs to end of file without a case-study boundary', () => {
  assert.doesNotThrow(() => assertPricingCssScoped(standaloneCss(`
.pricing-page .one,
.pricing-page .two { color: black; }
@media (min-width: 1024px) {
  .pricing-page .three { display: grid; }
}`), { standalone: true }));
});

test('standalone: rejects an unscoped selector at the end of the file', () => {
  assert.throws(
    () => assertPricingCssScoped(standaloneCss('.pricing-page .one { color: black; }\n.leaked-tail { color: red; }'), { standalone: true }),
    /not route-scoped: \.leaked-tail/,
  );
});

test('standalone: rejects a stylesheet with no start marker', () => {
  assert.throws(
    () => assertPricingCssScoped('.pricing-page .fine-print { color: white; }\n.pricing-page .one { color: black; }', { standalone: true }),
    /block marker is missing/,
  );
});

test('standalone: rejects an empty block after the marker', () => {
  assert.throws(
    () => assertPricingCssScoped(standaloneCss(''), { standalone: true }),
    /has no rules/,
  );
});

test('standalone: still rejects an unscoped fine-print rule', () => {
  assert.throws(
    () => assertPricingCssScoped(standaloneCss('.pricing-page .one { color: black; }').replace('.pricing-page .fine-print', '.fine-print'), { standalone: true }),
    /fine print selector is not route-scoped/,
  );
});

test('default mode still requires the following case-study boundary', () => {
  assert.throws(
    () => assertPricingCssScoped(standaloneCss('.pricing-page .one { color: black; }')),
    /following case-study boundary is missing/,
  );
});

test('rejects an unscoped fine-print rule outside the marked block', () => {
  assert.throws(
    () => assertPricingCssScoped(css('.pricing-page .one { color: black; }').replace(
      '.pricing-page .fine-print',
      '.fine-print',
    )),
    /fine print selector is not route-scoped/,
  );
});
