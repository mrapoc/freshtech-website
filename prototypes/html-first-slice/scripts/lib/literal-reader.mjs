import ts from 'typescript';

// Fail-closed literal reader built on the repository's scripts/content-chunks.mjs
// rules: only string, template-without-substitution, numeric, signed numeric,
// boolean and null literals, arrays of those, and object literals whose members
// are plain (non-computed) property assignments. Anything else (identifiers,
// spreads, calls, template substitutions, shorthand/method members, computed
// keys) throws instead of being evaluated.

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function describe(file, node) {
  const { line, character } = file.getLineAndCharacterOfPosition(node.getStart(file));
  return `${file.fileName}:${line + 1}:${character + 1}`;
}

export function parseSource(fileName, source) {
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, kind);
  if (file.parseDiagnostics.length) throw new Error(`${fileName} does not parse as TypeScript`);
  return file;
}

function propertyKey(file, property) {
  if (!ts.isPropertyAssignment(property)) throw new Error(`Only plain property assignments are supported at ${describe(file, property)}`);
  if (ts.isComputedPropertyName(property.name)) throw new Error(`Computed property keys are not supported at ${describe(file, property)}`);
  if (!(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) || ts.isNoSubstitutionTemplateLiteral(property.name))) {
    throw new Error(`Unsupported property key at ${describe(file, property)}`);
  }
  const key = property.name.text;
  if (UNSAFE_KEYS.has(key)) throw new Error(`Unsafe object key ${key} at ${describe(file, property)}`);
  return key;
}

export function literalValue(file, node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    if (node.operator === ts.SyntaxKind.MinusToken) return -Number(node.operand.text);
    if (node.operator === ts.SyntaxKind.PlusToken) return Number(node.operand.text);
  }
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
    throw new Error(`Wrapped expressions are not supported at ${describe(file, node)}`);
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map(element => {
      if (ts.isSpreadElement(element) || ts.isOmittedExpression(element)) throw new Error(`Array spread or hole at ${describe(file, element)}`);
      return literalValue(file, element);
    });
  }
  if (ts.isObjectLiteralExpression(node)) {
    const result = {};
    for (const property of node.properties) {
      const key = propertyKey(file, property);
      if (Object.hasOwn(result, key)) throw new Error(`Duplicate object key ${key} at ${describe(file, property)}`);
      result[key] = literalValue(file, property.initializer);
    }
    return result;
  }
  throw new Error(`Non-literal expression (${ts.SyntaxKind[node.kind]}) at ${describe(file, node)}`);
}

export function isLiteral(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isNumericLiteral(node)) return true;
  if ([ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(node.kind)) return true;
  if (ts.isPrefixUnaryExpression(node)) return [ts.SyntaxKind.PlusToken, ts.SyntaxKind.MinusToken].includes(node.operator) && ts.isNumericLiteral(node.operand);
  if (ts.isArrayLiteralExpression(node)) return node.elements.every(isLiteral);
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.every(property => ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name) && isLiteral(property.initializer));
  }
  return false;
}

// Finds a top-level `const NAME = <literal>` (exported or not) and returns its
// value. Exactly one declaration with that name must exist.
export function topLevelConstLiteral(file, name) {
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
  return literalValue(file, declaration.initializer);
}

// Returns the property names declared on a top-level `interface NAME { ... }`.
export function interfaceMembers(file, name) {
  const matches = file.statements.filter(statement => ts.isInterfaceDeclaration(statement) && statement.name.text === name);
  if (matches.length !== 1) throw new Error(`${file.fileName} must declare interface ${name} exactly once`);
  return matches[0].members.map(member => {
    if (!ts.isPropertySignature(member) || !(ts.isIdentifier(member.name) || ts.isStringLiteral(member.name))) {
      throw new Error(`Interface ${name} must contain only named property signatures`);
    }
    return { name: member.name.text, optional: Boolean(member.questionToken) };
  });
}

export function assertPlainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object literal`);
  return value;
}

export function assertExactKeys(value, keys, label) {
  assertPlainObject(value, label);
  const actual = Object.keys(value);
  const expected = [...keys];
  for (const key of expected) if (!actual.includes(key)) throw new Error(`${label} is missing field ${key}`);
  for (const key of actual) if (!expected.includes(key)) throw new Error(`${label} has unexpected field ${key}`);
  return value;
}

export function assertString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

export function assertArray(value, label, minimum = 1) {
  if (!Array.isArray(value) || value.length < minimum) throw new Error(`${label} must be an array with at least ${minimum} entries`);
  return value;
}

export { ts };
