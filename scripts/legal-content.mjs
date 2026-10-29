import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(projectRoot, 'content');

export function parseFrontMatter(source, fileName) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error(`${fileName}: missing YAML front matter`);
  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z_]+):\s*(.*)$/);
    if (field) values[field[1]] = field[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  return values;
}

export function getLegalRoutes() {
  const config = JSON.parse(fs.readFileSync(path.join(contentDir, 'legal-pages.json'), 'utf8'));
  const routes = Object.keys(config.current).map(slug => `/${slug}`);

  for (const fileName of fs.readdirSync(contentDir).filter(name => name.endsWith('.md'))) {
    const source = fs.readFileSync(path.join(contentDir, fileName), 'utf8');
    const metadata = parseFrontMatter(source, fileName);
    if (metadata.version && metadata.slug) {
      routes.push(`/${metadata.slug}/v${metadata.version.replace(/\./g, '-')}`);
    }
  }

  return [...new Set(routes)];
}
