import assert from 'node:assert/strict';
import test from 'node:test';

import { parseSource, topLevelConstLiteral } from './literal-reader.mjs';

function read(initializer) {
  const source = `const VALUE = ${initializer};`;
  return topLevelConstLiteral(parseSource('fixture.ts', source), 'VALUE');
}

test('preserves the supported literal value types', () => {
  assert.deepEqual(read(`{
    text: 'plain', template: \`static\`, number: 12.5, negative: -3,
    positive: +4, yes: true, no: false, empty: null,
    nested: [{ label: 'one' }, 2],
  }`), {
    text: 'plain', template: 'static', number: 12.5, negative: -3,
    positive: 4, yes: true, no: false, empty: null,
    nested: [{ label: 'one' }, 2],
  });
});

for (const [name, initializer, message] of [
  ['calls', `{ value: makeValue() }`, /Non-literal expression \(CallExpression\)/],
  ['object spreads', `{ safe: 'yes', ...other }`, /Only plain property assignments/],
  ['array spreads', `['safe', ...other]`, /Array spread or hole/],
  ['computed keys', `{ ['key']: 'value' }`, /Computed property keys/],
  ['duplicate keys', `{ key: 'first', key: 'second' }`, /Duplicate object key key/],
  ['prototype keys', `{ __proto__: 'unsafe' }`, /Unsafe object key __proto__/],
  ['constructor keys', `{ constructor: 'unsafe' }`, /Unsafe object key constructor/],
  ['template substitutions', `{ value: \`prefix-${'${dynamic}'}\` }`, /Non-literal expression \(TemplateExpression\)/],
]) {
  test(`rejects ${name}`, () => {
    assert.throws(() => read(initializer), message);
  });
}
