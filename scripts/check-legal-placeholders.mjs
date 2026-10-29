import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(projectRoot, 'content');
const productionTarget =
  process.env.CONTEXT === 'production' || process.env.LEGAL_BUILD_TARGET === 'production';
const findings = [];

for (const fileName of fs.readdirSync(contentDir)) {
  const filePath = path.join(contentDir, fileName);
  if (!fs.statSync(filePath).isFile()) continue;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/\[(?:DECIDE|VERIFY)/.test(line))
      findings.push(`${path.join('content', fileName)}:${index + 1}: ${line.trim()}`);
  });
}

if (findings.length === 0) process.exit(0);

const message = [
  productionTarget
    ? 'Legal content placeholders block this production build:'
    : 'WARNING: legal content placeholders remain in this preview/local build:',
  ...findings.map(finding => `  ${finding}`),
].join('\n');

if (productionTarget) {
  console.error(message);
  process.exit(1);
}

console.warn(message);
