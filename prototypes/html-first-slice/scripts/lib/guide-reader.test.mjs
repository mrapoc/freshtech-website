import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { KNOWN_LUCIDE_ICONS, PRIORITIES, lucideImports, readGuides } from './guide-reader.mjs';
import { parseSource } from './literal-reader.mjs';

// Synthetic fixtures only. Shapes follow data/industryGuides.ts; the copy does not.
const IMPORTS = "import React from 'react';\nimport { Shield, Monitor, Wifi } from 'lucide-react';\n";
const obj = fields => `{ ${Object.entries(fields).filter(([, value]) => value !== undefined).map(([name, value]) => `${name}: ${value}`).join(', ')} }`;
const check = (id, overrides = {}) => obj({ id: `'${id}'`, text: "'Do the thing'", priority: "'high'", tip: "'A tip'", ...overrides });
const section = (id, overrides = {}) => obj({
  id: `'${id}'`, title: `'Section ${id}'`, icon: 'Monitor',
  content: '`Intro line\\n\\n**Heading:**\\n• one\\n• two`',
  checklist: `[${check(`${id}-1`)}, ${check(`${id}-2`, { tip: undefined })}]`,
  ...overrides,
});
const guide = (overrides = {}) => obj({
  industry: "'Engineering'", title: "'Guide title'", subtitle: "'Guide subtitle'", metaDesc: "'Meta description.'", intro: "'Intro paragraph.'",
  stats: "{ readTime: '15 min', lastUpdated: 'Dec 2025' }",
  sections: `[${section('one')}, ${section('two', { icon: 'Wifi', locked: 'true' })}]`,
  ...overrides,
});
const source = (entries, imports = IMPORTS) => `${imports}export const industryGuides = { ${entries} };\nexport const other = 1;`;
const single = (overrides, imports) => source(`engineering: ${guide(overrides)}`, imports);
const withSections = sections => single({ sections: `[${sections.join(', ')}]` });

test('reads keyed guides in source order with slug, verbatim strings, checklist tips and locked flags', () => {
  const guides = readGuides('fixture.ts', source(`engineering: ${guide()}, "renewable-energy": ${guide({ industry: "'Renewable Energy'" })}`));
  assert.deepEqual(guides.map(item => item.slug), ['engineering', 'renewable-energy']);
  assert.deepEqual(guides[0], {
    slug: 'engineering',
    industry: 'Engineering', title: 'Guide title', subtitle: 'Guide subtitle', metaDesc: 'Meta description.', intro: 'Intro paragraph.',
    stats: { readTime: '15 min', lastUpdated: 'Dec 2025' },
    sections: [
      {
        id: 'one', title: 'Section one', icon: 'Monitor', content: 'Intro line\n\n**Heading:**\n• one\n• two',
        checklist: [{ id: 'one-1', text: 'Do the thing', priority: 'high', tip: 'A tip' }, { id: 'one-2', text: 'Do the thing', priority: 'high' }],
        locked: false,
      },
      {
        id: 'two', title: 'Section two', icon: 'Wifi', content: 'Intro line\n\n**Heading:**\n• one\n• two',
        checklist: [{ id: 'two-1', text: 'Do the thing', priority: 'high', tip: 'A tip' }, { id: 'two-2', text: 'Do the thing', priority: 'high' }],
        locked: true,
      },
    ],
  });
  assert.equal('tip' in guides[0].sections[0].checklist[1], false, 'absent tip is not invented');
  assert.equal(guides[1].industry, 'Renewable Energy');
});

test('defaults: absent checklist becomes an empty array and explicit locked false stays false', () => {
  const [record] = readGuides('fixture.ts', withSections([section('one', { checklist: undefined, locked: 'false' })]));
  assert.deepEqual(record.sections[0].checklist, []);
  assert.equal(record.sections[0].locked, false);
  for (const priority of PRIORITIES) {
    const [item] = readGuides('fixture.ts', withSections([section('one', { checklist: `[${check('one-1', { priority: `'${priority}'` })}]` })]));
    assert.equal(item.sections[0].checklist[0].priority, priority);
  }
});

test('icon: only a bare, un-aliased, value import from lucide-react that is on the allow-list is accepted', () => {
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { icon: 'Zap' })])), /icon identifier Zap is not a value import from lucide-react/);
  assert.throws(() => readGuides('fixture.ts', single({}, "import { Zap } from 'lucide-react';\n").replace('icon: Monitor', 'icon: Zap')), /Zap is not a known lucide icon name/);
  assert.throws(() => readGuides('fixture.ts', single({}, "import { Monitor as Mon, Wifi } from 'lucide-react';\n").replace(/icon: Monitor/g, 'icon: Mon')), /Mon is an aliased import of Monitor/);
  assert.throws(() => readGuides('fixture.ts', single({}, "import { Monitor, Wifi } from './icons';\n")), /Monitor is not a value import from lucide-react/);
  assert.throws(() => readGuides('fixture.ts', single({}, "import type { Monitor, Wifi } from 'lucide-react';\n")), /Monitor is not a value import from lucide-react/);
  assert.throws(() => readGuides('fixture.ts', single({}, "import { type Monitor, Wifi } from 'lucide-react';\n")), /Monitor is not a value import from lucide-react/);
  assert.throws(() => readGuides('fixture.ts', single({}, "import Monitor from 'lucide-react';\nimport { Wifi } from 'lucide-react';\n")), /Monitor is not a value import from lucide-react/);
  assert.throws(() => readGuides('fixture.ts', single({}, "import * as Icons from 'lucide-react';\nimport { Wifi } from 'lucide-react';\n").replace(/icon: Monitor/g, 'icon: Icons.Monitor')), /must be a bare lucide-react import name, not PropertyAccessExpression/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { icon: "'Monitor'" })])), /must be a bare lucide-react import name, not StringLiteral/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { icon: 'Monitor()' })])), /must be a bare lucide-react import name, not CallExpression/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { icon: '[Monitor]' })])), /must be a bare lucide-react import name, not ArrayLiteralExpression/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { icon: '(Monitor)' })])), /must be a bare lucide-react import name, not ParenthesizedExpression/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { icon: 'undefined' })])), /undefined is not a value import/);
  // Identifiers are never accepted anywhere else, even known icon names.
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { title: 'Monitor' })])), /Non-literal expression \(Identifier\)/);
  assert.throws(() => readGuides('fixture.ts', single({ title: 'Shield' })), /Non-literal expression \(Identifier\)/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { checklist: `[${check('one-1', { tip: 'Shield' })}]` })])), /Non-literal expression \(Identifier\)/);
  assert.ok(KNOWN_LUCIDE_ICONS.has('Monitor') && !KNOWN_LUCIDE_ICONS.has('Zap'));
  const imports = lucideImports(parseSource('fixture.ts', "import { A, B as C } from 'lucide-react';\nimport { D } from 'other';\nimport type { E } from 'lucide-react';"));
  assert.deepEqual([...imports], [['A', 'A'], ['C', 'B']]);
});

test('guide keys: unsafe slugs, prototype keys, duplicate keys and duplicate industry names fail', () => {
  assert.throws(() => readGuides('fixture.ts', source(`"Bad Slug": ${guide()}`)), /key "Bad Slug" is not a safe route segment/);
  assert.throws(() => readGuides('fixture.ts', source(`"a/b": ${guide()}`)), /not a safe route segment/);
  assert.throws(() => readGuides('fixture.ts', source(`"-lead": ${guide()}`)), /not a safe route segment/);
  assert.throws(() => readGuides('fixture.ts', source(`Engineering: ${guide()}`)), /not a safe route segment/);
  assert.throws(() => readGuides('fixture.ts', source(`__proto__: ${guide()}`)), /Unsafe object key __proto__/);
  assert.throws(() => readGuides('fixture.ts', source(`"constructor": ${guide()}`)), /Unsafe object key constructor/);
  assert.throws(() => readGuides('fixture.ts', source(`prototype: ${guide()}`)), /Unsafe object key prototype/);
  assert.throws(() => readGuides('fixture.ts', source(`engineering: ${guide()}, engineering: ${guide()}`)), /Duplicate object key engineering/);
  assert.throws(() => readGuides('fixture.ts', source(`engineering: ${guide()}, legal: ${guide()}`)), /Duplicate guide industry name Engineering/);
  assert.throws(() => readGuides('fixture.ts', source('')), /must contain at least one guide/);
});

test('guide fields: missing, unexpected, empty and mis-shaped values fail', () => {
  assert.throws(() => readGuides('fixture.ts', single({ metaDesc: undefined })), /industryGuides\.engineering is missing field metaDesc/);
  assert.throws(() => readGuides('fixture.ts', single({ extra: "'x'" })), /has unexpected field extra/);
  assert.throws(() => readGuides('fixture.ts', single({ intro: "''" })), /industryGuides\.engineering\.intro must be a non-empty string/);
  assert.throws(() => readGuides('fixture.ts', single({ title: "'   '" })), /engineering\.title must be a non-empty string/);
  assert.throws(() => readGuides('fixture.ts', single({ title: '42' })), /engineering\.title must be a non-empty string/);
  assert.throws(() => readGuides('fixture.ts', single({ stats: "{ readTime: '15 min' }" })), /stats is missing field lastUpdated/);
  assert.throws(() => readGuides('fixture.ts', single({ stats: "{ readTime: '15 min', lastUpdated: 'Dec 2025', words: 3 }" })), /stats has unexpected field words/);
  assert.throws(() => readGuides('fixture.ts', single({ stats: "'15 min'" })), /stats must be an object literal/);
  assert.throws(() => readGuides('fixture.ts', single({ sections: '[]' })), /sections must be an array with at least 1/);
  assert.throws(() => readGuides('fixture.ts', single({ sections: "'none'" })), /sections must be an array literal/);
  assert.throws(() => readGuides('fixture.ts', single({ sections: "['x']" })), /sections\[0\] must be an object literal/);
});

test('section fields: ids, duplicates, checklist shape, priority and locked are validated fail-closed', () => {
  assert.throws(() => readGuides('fixture.ts', withSections([section('Work Stations')])), /sections\[0\]\.id "Work Stations" is not a safe identifier/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one'), section('one')])), /sections\[1\]\.id "one" duplicates another section/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { content: undefined })])), /sections\[0\] is missing field content/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { icon: undefined })])), /sections\[0\] is missing field icon/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { content: '``' })])), /sections\[0\]\.content must be a non-empty string/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { summary: "'x'" })])), /sections\[0\] has unexpected field summary/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { checklist: '[]' })])), /checklist must be an array with at least 1/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { checklist: "'todo'" })])), /checklist must be an array with at least 1/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { checklist: "['todo']" })])), /checklist\[0\] must be an object literal/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { checklist: `[${check('one-1', { priority: "'low'" })}]` })])), /priority "low" must be one of critical, high, medium/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { checklist: `[${check('one-1', { priority: "'High'" })}]` })])), /priority "High" must be one of/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { checklist: `[${check('one-1', { priority: '1' })}]` })])), /checklist\[0\]\.priority must be a non-empty string/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { checklist: `[${check('one-1', { priority: undefined })}]` })])), /checklist\[0\] is missing field priority/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { checklist: `[${check('one-1', { tip: "''" })}]` })])), /checklist\[0\]\.tip must be a non-empty string/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { checklist: `[${check('one-1', { tip: 'true' })}]` })])), /checklist\[0\]\.tip must be a non-empty string/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { checklist: `[${check('one-1', { done: 'false' })}]` })])), /checklist\[0\] has unexpected field done/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { checklist: `[${check('Eng 1')}]` })])), /checklist\[0\]\.id "Eng 1" is not a safe identifier/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { checklist: `[${check('one-1')}, ${check('one-1')}]` })])), /checklist\[1\]\.id "one-1" duplicates another checklist item/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one'), section('two', { checklist: `[${check('one-1')}]` })])), /sections\[1\]\.checklist\[0\]\.id "one-1" duplicates/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { locked: "'true'" })])), /sections\[0\]\.locked must be a boolean literal/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { locked: '1' })])), /locked must be a boolean literal/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { locked: 'null' })])), /locked must be a boolean literal/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { locked: '!false' })])), /Non-literal expression/);
});

test('expressions: spreads, computed keys, shorthand, methods, calls, substitutions and wrappers all fail', () => {
  assert.throws(() => readGuides('fixture.ts', source(`engineering: { ...${guide()} }`)), /Only plain property assignments/);
  assert.throws(() => readGuides('fixture.ts', withSections([`{ ...${section('one')} }`])), /Only plain property assignments/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { checklist: `[...[${check('one-1')}]]` })])), /Array spread or hole/);
  assert.throws(() => readGuides('fixture.ts', withSections([`...[${section('one')}]`])), /Array spread or hole/);
  assert.throws(() => readGuides('fixture.ts', single({ sections: `[${section('one')}, , ${section('two')}]` })), /Array spread or hole/);
  assert.throws(() => readGuides('fixture.ts', source(`['eng' + 'ineering']: ${guide()}`)), /Computed property keys are not supported/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one').replace("title: 'Section one'", "['title']: 'Section one'")])), /Computed property keys/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one').replace("title: 'Section one'", 'title')])), /Only plain property assignments/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one').replace("title: 'Section one'", "title() { return 'x'; }")])), /Only plain property assignments/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one').replace("title: 'Section one'", "get title() { return 'x'; }")])), /Only plain property assignments/);
  assert.throws(() => readGuides('fixture.ts', single({ sections: 'buildSections()' })), /sections must be an array literal/);
  assert.throws(() => readGuides('fixture.ts', single({ intro: "greeting('x')" })), /Non-literal expression \(CallExpression\)/);
  assert.throws(() => readGuides('fixture.ts', withSections([section('one', { content: '`Read ${count} items`' })])), /Non-literal expression \(TemplateExpression\)/);
  assert.throws(() => readGuides('fixture.ts', single({ title: "'x' as string" })), /Wrapped expressions are not supported/);
  assert.throws(() => readGuides('fixture.ts', single({ title: "('x')" })), /Wrapped expressions are not supported/);
  assert.throws(() => readGuides('fixture.ts', single({ title: "'a' + 'b'" })), /Non-literal expression \(BinaryExpression\)/);
  assert.throws(() => readGuides('fixture.ts', single({ stats: 'stats' })), /Non-literal expression \(Identifier\)/);
  assert.throws(() => readGuides('fixture.ts', `${IMPORTS}const shared = ${guide()}; export const industryGuides = { engineering: shared };`), /industryGuides\.engineering must be an object literal/);
  assert.throws(() => readGuides('fixture.ts', `${IMPORTS}export let industryGuides = { engineering: ${guide()} };`), /must be a const declaration/);
  assert.throws(() => readGuides('fixture.ts', `${IMPORTS}export const other = {};`), /must declare industryGuides exactly once \(found 0\)/);
  assert.throws(() => readGuides('fixture.ts', `${IMPORTS}export const industryGuides = {}; const industryGuides2 = 1; export const industryGuides = {};`), /must declare industryGuides exactly once \(found 2\)/);
  assert.throws(() => readGuides('fixture.ts', `${IMPORTS}export const industryGuides = [${guide()}];`), /industryGuides must be an object literal/);
  assert.throws(() => readGuides('fixture.ts', `${IMPORTS}export const industryGuides = { engineering: ${guide()}`), /does not parse as TypeScript/);
});

test('type annotations on the declaration are ignored; the initializer is what is read', () => {
  const guides = readGuides('fixture.ts', `${IMPORTS}export const industryGuides: Record<string, IndustryGuide> = { engineering: ${guide()} };`);
  assert.equal(guides.length, 1);
  assert.equal(guides[0].slug, 'engineering');
});

// Real-source inventory. Skipped when the checkout does not carry the data file
// (the reader itself is exercised by the synthetic cases above).
const sourcePath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'data', 'industryGuides.ts');
test('real source: seven keyed guides, four sections each, last section locked, every icon known', { skip: !existsSync(sourcePath) }, () => {
  const guides = readGuides('data/industryGuides.ts', readFileSync(sourcePath, 'utf8'));
  assert.deepEqual(guides.map(item => item.slug), ['engineering', 'legal', 'healthcare', 'manufacturing', 'veterinary', 'renewable-energy', 'retail-distribution']);
  for (const item of guides) {
    assert.equal(item.sections.length, 4, `${item.slug} has four sections`);
    assert.deepEqual(item.sections.map(sectionItem => sectionItem.locked), [false, false, false, true], `${item.slug} locks only its last section`);
    for (const sectionItem of item.sections) {
      assert.ok(KNOWN_LUCIDE_ICONS.has(sectionItem.icon), `${item.slug}/${sectionItem.id} icon ${sectionItem.icon}`);
      assert.ok(sectionItem.checklist.length > 0, `${item.slug}/${sectionItem.id} has a checklist`);
      assert.ok(sectionItem.content.includes('**'), `${item.slug}/${sectionItem.id} content carries bold subheadings`);
    }
  }
  const checks = guides.flatMap(item => item.sections.flatMap(sectionItem => sectionItem.checklist));
  assert.equal(checks.length, 139);
  assert.equal(new Set(checks.map(item => item.id)).size, checks.length, 'checklist ids are unique across all guides');
  assert.ok(checks.some(item => item.tip), 'at least one tip survives extraction');
});
