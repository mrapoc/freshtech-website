import { assertArray, assertPlainObject, assertString, literalValue, parseSource, ts } from './literal-reader.mjs';

// Fail-closed reader for the `industryGuides` record in data/industryGuides.ts.
// The source is never executed: it is parsed with the TypeScript compiler API
// and walked structurally. Every value must be a literal in the sense of
// literal-reader.mjs, with exactly one exception: `section.icon` is a bare
// identifier that must be a named, un-aliased, value import from 'lucide-react'
// AND appear in KNOWN_LUCIDE_ICONS. Any other expression anywhere (spreads,
// computed keys, shorthand members, calls, template substitutions, wrapped
// expressions, identifiers outside section.icon) throws.
//
// Output: an array in source order, one record per guide, carrying the record
// key as `slug` plus every source field. Strings, checklists, tips and locked
// flags are copied verbatim. `checklist` is always an array and `locked` is
// always a boolean so downstream code never branches on presence. Locked
// sections are returned like any other: gating (or not) is a template concern.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ID_PATTERN = SLUG_PATTERN;
export const GUIDE_FIELDS = ['industry', 'title', 'subtitle', 'metaDesc', 'intro', 'stats', 'sections'];
export const STATS_FIELDS = ['readTime', 'lastUpdated'];
export const SECTION_REQUIRED_FIELDS = ['id', 'title', 'icon', 'content'];
export const SECTION_OPTIONAL_FIELDS = ['checklist', 'locked'];
export const CHECK_REQUIRED_FIELDS = ['id', 'text', 'priority'];
export const CHECK_OPTIONAL_FIELDS = ['tip'];
export const PRIORITIES = ['critical', 'high', 'medium'];
export const LUCIDE_MODULE = 'lucide-react';
// Explicit allow-list of lucide-react icon names the guide source may use.
// Extend deliberately; an unknown name fails extraction rather than emitting
// an icon the template has no rendering for.
export const KNOWN_LUCIDE_ICONS = new Set([
  'AlertTriangle', 'Battery', 'Cloud', 'FileText', 'Lock', 'Monitor', 'Package', 'Server', 'Shield', 'Smartphone', 'Sun', 'Truck', 'Wifi',
]);

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function describe(file, node) {
  const { line, character } = file.getLineAndCharacterOfPosition(node.getStart(file));
  return `${file.fileName}:${line + 1}:${character + 1}`;
}

// Same member rules as literal-reader's private propertyKey: plain, non-computed
// property assignments with identifier or string keys, never prototype keys.
function memberKey(file, property) {
  if (!ts.isPropertyAssignment(property)) throw new Error(`Only plain property assignments are supported at ${describe(file, property)}`);
  if (ts.isComputedPropertyName(property.name)) throw new Error(`Computed property keys are not supported at ${describe(file, property)}`);
  if (!(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) || ts.isNoSubstitutionTemplateLiteral(property.name))) {
    throw new Error(`Unsupported property key at ${describe(file, property)}`);
  }
  const key = property.name.text;
  if (UNSAFE_KEYS.has(key)) throw new Error(`Unsafe object key ${key} at ${describe(file, property)}`);
  return key;
}

function objectMembers(file, node, label) {
  if (!ts.isObjectLiteralExpression(node)) throw new Error(`${label} must be an object literal at ${describe(file, node)}`);
  const members = new Map();
  for (const property of node.properties) {
    const key = memberKey(file, property);
    if (members.has(key)) throw new Error(`Duplicate object key ${key} at ${describe(file, property)}`);
    members.set(key, property.initializer);
  }
  return members;
}

function arrayElements(file, node, label) {
  if (!ts.isArrayLiteralExpression(node)) throw new Error(`${label} must be an array literal at ${describe(file, node)}`);
  return node.elements.map(element => {
    if (ts.isSpreadElement(element) || ts.isOmittedExpression(element)) throw new Error(`Array spread or hole at ${describe(file, element)}`);
    return element;
  });
}

// Finds the initializer of the single top-level `const NAME = ...` declaration.
function topLevelConstInitializer(file, name) {
  const matches = [];
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) matches.push({ statement, declaration });
    }
  }
  if (matches.length !== 1) throw new Error(`${file.fileName} must declare ${name} exactly once (found ${matches.length})`);
  const { statement, declaration } = matches[0];
  if (!(statement.declarationList.flags & ts.NodeFlags.Const)) throw new Error(`${name} must be a const declaration`);
  if (!declaration.initializer) throw new Error(`${name} has no initializer`);
  return declaration.initializer;
}

// Local name -> imported name for every value import from lucide-react.
// Type-only imports, default imports and namespace imports never qualify.
export function lucideImports(file) {
  const names = new Map();
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text !== LUCIDE_MODULE) continue;
    const clause = statement.importClause;
    if (!clause || clause.isTypeOnly || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue;
    for (const element of clause.namedBindings.elements) {
      if (element.isTypeOnly) continue;
      names.set(element.name.text, element.propertyName ? element.propertyName.text : element.name.text);
    }
  }
  return names;
}

function iconName(file, node, imports, label) {
  if (!ts.isIdentifier(node)) throw new Error(`${label} must be a bare lucide-react import name, not ${ts.SyntaxKind[node.kind]}, at ${describe(file, node)}`);
  const name = node.text;
  const imported = imports.get(name);
  if (imported === undefined) throw new Error(`${label} identifier ${name} is not a value import from ${LUCIDE_MODULE} at ${describe(file, node)}`);
  if (imported !== name) throw new Error(`${label} identifier ${name} is an aliased import of ${imported}; aliases are not accepted at ${describe(file, node)}`);
  if (!KNOWN_LUCIDE_ICONS.has(name)) throw new Error(`${label} identifier ${name} is not a known lucide icon name at ${describe(file, node)}`);
  return name;
}

// Structural walk. Only the `icon` member of a section may be a non-literal.
function sectionSource(file, node, imports, label) {
  const section = {};
  for (const [key, initializer] of objectMembers(file, node, label)) {
    section[key] = key === 'icon' ? iconName(file, initializer, imports, `${label}.icon`) : literalValue(file, initializer);
  }
  return section;
}

function guideSource(file, node, imports, label) {
  const guide = {};
  for (const [key, initializer] of objectMembers(file, node, label)) {
    if (key === 'sections') {
      guide.sections = arrayElements(file, initializer, `${label}.sections`).map((element, index) => sectionSource(file, element, imports, `${label}.sections[${index}]`));
    } else {
      guide[key] = literalValue(file, initializer);
    }
  }
  return guide;
}

// Plain data for the whole record, keyed as in source, before validation.
export function guideSourceValues(file, name = 'industryGuides') {
  const imports = lucideImports(file);
  const record = {};
  for (const [key, initializer] of objectMembers(file, topLevelConstInitializer(file, name), name)) {
    record[key] = guideSource(file, initializer, imports, `${name}.${key}`);
  }
  return record;
}

function assertOnlyFields(value, required, optional, label) {
  assertPlainObject(value, label);
  for (const key of Object.keys(value)) {
    if (!required.includes(key) && !optional.includes(key)) throw new Error(`${label} has unexpected field ${key}`);
  }
  for (const field of required) {
    if (!Object.hasOwn(value, field)) throw new Error(`${label} is missing field ${field}`);
  }
}

function validateCheck(item, label, checkIds) {
  assertOnlyFields(item, CHECK_REQUIRED_FIELDS, CHECK_OPTIONAL_FIELDS, label);
  const id = assertString(item.id, `${label}.id`);
  if (!ID_PATTERN.test(id)) throw new Error(`${label}.id "${id}" is not a safe identifier`);
  if (checkIds.has(id)) throw new Error(`${label}.id "${id}" duplicates another checklist item in this guide`);
  checkIds.add(id);
  const text = assertString(item.text, `${label}.text`);
  const priority = assertString(item.priority, `${label}.priority`);
  if (!PRIORITIES.includes(priority)) throw new Error(`${label}.priority "${priority}" must be one of ${PRIORITIES.join(', ')}`);
  const check = { id, text, priority };
  if (Object.hasOwn(item, 'tip')) check.tip = assertString(item.tip, `${label}.tip`);
  return check;
}

function validateSection(section, label, sectionIds, checkIds) {
  assertOnlyFields(section, SECTION_REQUIRED_FIELDS, SECTION_OPTIONAL_FIELDS, label);
  const id = assertString(section.id, `${label}.id`);
  if (!ID_PATTERN.test(id)) throw new Error(`${label}.id "${id}" is not a safe identifier`);
  if (sectionIds.has(id)) throw new Error(`${label}.id "${id}" duplicates another section in this guide`);
  sectionIds.add(id);
  const title = assertString(section.title, `${label}.title`);
  const icon = assertString(section.icon, `${label}.icon`);
  if (!KNOWN_LUCIDE_ICONS.has(icon)) throw new Error(`${label}.icon "${icon}" is not a known lucide icon name`);
  const content = assertString(section.content, `${label}.content`);
  let checklist = [];
  if (Object.hasOwn(section, 'checklist')) {
    checklist = assertArray(section.checklist, `${label}.checklist`).map((item, index) => validateCheck(item, `${label}.checklist[${index}]`, checkIds));
  }
  let locked = false;
  if (Object.hasOwn(section, 'locked')) {
    if (typeof section.locked !== 'boolean') throw new Error(`${label}.locked must be a boolean literal`);
    locked = section.locked;
  }
  return { id, title, icon, content, checklist, locked };
}

function validateGuide(key, guide) {
  const label = `industryGuides.${key}`;
  if (!SLUG_PATTERN.test(key)) throw new Error(`industryGuides key "${key}" is not a safe route segment`);
  assertOnlyFields(guide, GUIDE_FIELDS, [], label);
  const strings = {};
  for (const field of ['industry', 'title', 'subtitle', 'metaDesc', 'intro']) {
    strings[field] = assertString(guide[field], `${label}.${field}`);
  }
  assertOnlyFields(guide.stats, STATS_FIELDS, [], `${label}.stats`);
  const stats = {};
  for (const field of STATS_FIELDS) stats[field] = assertString(guide.stats[field], `${label}.stats.${field}`);
  const sectionIds = new Set();
  const checkIds = new Set();
  const sections = assertArray(guide.sections, `${label}.sections`).map((section, index) => validateSection(section, `${label}.sections[${index}]`, sectionIds, checkIds));
  return { slug: key, ...strings, stats, sections };
}

// Parses source text and returns every validated guide in source order.
export function readGuides(fileName, source) {
  const file = parseSource(fileName, source);
  const record = guideSourceValues(file, 'industryGuides');
  const keys = Object.keys(record);
  if (!keys.length) throw new Error('industryGuides must contain at least one guide');
  const industries = new Set();
  return keys.map(key => {
    const guide = validateGuide(key, record[key]);
    const nameKey = guide.industry.toLocaleLowerCase('en-GB');
    if (industries.has(nameKey)) throw new Error(`Duplicate guide industry name ${guide.industry}`);
    industries.add(nameKey);
    return guide;
  });
}
