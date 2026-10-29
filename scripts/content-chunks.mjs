import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// Build-time projection of the navigation labels the layout chrome needs.
// Mirrors data/navigation.ts exactly (Object.values order, slug and h1 only)
// so the eager bundle stops carrying the full industry and problem records.
export const navigationRecords = ['industryPages', 'problemPages'];

export function navigationLinks(source) {
  splitContent(source);
  const file = ts.createSourceFile('content.ts', source, ts.ScriptTarget.Latest, true);
  const result = {};
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const declaration = statement.declarationList.declarations[0];
    if (!declaration || !ts.isIdentifier(declaration.name) || !navigationRecords.includes(declaration.name.text)) continue;
    if (!declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer) || result[declaration.name.text]) {
      throw new Error(`Navigation record ${declaration.name.text} must be a single object literal`);
    }
    const keys = new Set();
    result[declaration.name.text] = declaration.initializer.properties.map(property => {
      if (!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) ||
          !ts.isObjectLiteralExpression(property.initializer)) {
        throw new Error(`Navigation record ${declaration.name.text} entries must be plain keyed object literals`);
      }
      const key = property.name.text;
      // Integer-like or duplicate keys would change Object.values order or count.
      if (key === '__proto__' || /^\d+$/.test(key) || keys.has(key)) throw new Error(`Navigation record key ${key} would change runtime order`);
      keys.add(key);
      const link = {};
      for (const field of property.initializer.properties) {
        if (ts.isPropertyAssignment(field) && (ts.isIdentifier(field.name) || ts.isStringLiteral(field.name)) && ['slug', 'h1'].includes(field.name.text)) {
          if (!ts.isStringLiteral(field.initializer)) throw new Error(`Navigation ${field.name.text} for ${key} must be a string literal`);
          link[field.name.text] = field.initializer.text;
        }
      }
      if (typeof link.slug !== 'string' || typeof link.h1 !== 'string') throw new Error(`Navigation entry ${key} lacks slug or h1`);
      return { slug: link.slug, h1: link.h1 };
    });
  }
  for (const name of navigationRecords) if (!result[name]) throw new Error(`Navigation record ${name} not found`);
  return result;
}

export function navigationModule(source) {
  const links = navigationLinks(source);
  return `export const industryNavigation = ${JSON.stringify(links.industryPages)};\n` +
    `export const problemNavigation = ${JSON.stringify(links.problemPages)};\n`;
}

// Keep the editorial catalogue in one file, but give Rollup independent modules
// so a homepage visitor does not download every article and technology explainer.
function literal(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isNumericLiteral(node) || [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(node.kind)) return true;
  if (ts.isPrefixUnaryExpression(node)) return [ts.SyntaxKind.PlusToken, ts.SyntaxKind.MinusToken].includes(node.operator) && ts.isNumericLiteral(node.operand);
  if (ts.isArrayLiteralExpression(node)) return node.elements.every(literal);
  if (ts.isObjectLiteralExpression(node)) return node.properties.every(property =>
    ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name) && literal(property.initializer));
  return false;
}

export function splitContent(source) {
  const file = ts.createSourceFile('content.ts', source, ts.ScriptTarget.Latest, true);
  if (file.parseDiagnostics.length || !file.statements.length) throw new Error('Content catalogue must contain valid exported literal data');
  const parts = new Map();
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement) ||
        !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) ||
        !(statement.declarationList.flags & ts.NodeFlags.Const) || statement.declarationList.declarations.length !== 1) {
      throw new Error('Content catalogue supports only individual exported const data declarations');
    }
    const declaration = statement.declarationList.declarations[0];
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer || !literal(declaration.initializer) || parts.has(declaration.name.text)) {
      throw new Error('Content catalogue values must be independent literals with unique names');
    }
    parts.set(declaration.name.text, ts.transpileModule(statement.getText(file), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText);
  }
  return parts;
}

export function contentChunksPlugin() {
  const prefix = '\0fresh-tech-content:';
  let sourcePath;
  let navigationPath;
  let navigationProjected = false;
  let parts = new Map();
  return {
    name: 'content-record-chunks',
    apply: 'build',
    enforce: 'pre',
    configResolved(config) {
      sourcePath = path.resolve(config.root, 'data/content.ts').replaceAll('\\', '/');
      navigationPath = path.resolve(config.root, 'data/navigation.ts').replaceAll('\\', '/');
    },
    buildEnd(error) {
      // Fail loudly rather than silently shipping the full catalogue via the layout.
      if (!error && !navigationProjected) throw new Error('data/navigation.ts was not replaced by the build projection');
    },
    transform(code, id) {
      if (id.replaceAll('\\', '/') === navigationPath) {
        navigationProjected = true;
        return { code: navigationModule(fs.readFileSync(sourcePath, 'utf8')), map: null, moduleSideEffects: false };
      }
      if (id.replaceAll('\\', '/') !== sourcePath) return null;
      parts = splitContent(code);
      return {
        code: [...parts.keys()].map(name => `export { ${name} } from ${JSON.stringify(prefix + name)};`).join('\n'),
        map: null,
        moduleSideEffects: false,
      };
    },
    resolveId(id) {
      return id.startsWith(prefix) ? id : null;
    },
    load(id) {
      if (!id.startsWith(prefix)) return null;
      const code = parts.get(id.slice(prefix.length));
      if (!code) throw new Error('Unknown content record module');
      return { code, moduleSideEffects: false };
    },
  };
}
