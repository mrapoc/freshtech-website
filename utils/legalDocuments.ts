export interface LegalFrontMatter {
  title: string;
  slug: string;
  summary: string;
  version?: string;
  effective_date?: string;
  last_updated?: string;
}

export interface ParsedLegalDocument {
  metadata: LegalFrontMatter;
  body: string;
  placeholders: { token: string; line: number }[];
}

const REQUIRED_FIELDS = ['title', 'slug', 'summary'] as const;

export const parseLegalDocument = (source: string, fileName: string): ParsedLegalDocument => {
  const frontMatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontMatter) throw new Error(`${fileName}: missing YAML front matter`);

  const values: Record<string, string> = {};
  for (const line of frontMatter[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!field) continue;
    values[field[1]] = field[2].replace(/^(["'])(.*)\1$/, '$2');
  }

  for (const field of REQUIRED_FIELDS) {
    if (!values[field]) throw new Error(`${fileName}: missing front matter field ${field}`);
  }

  const placeholders: { token: string; line: number }[] = [];
  source.split(/\r?\n/).forEach((line, index) => {
    for (const match of line.matchAll(/\[(?:DECIDE|VERIFY)[^\]]*\]/g)) {
      placeholders.push({ token: match[0], line: index + 1 });
    }
  });

  return {
    metadata: values as unknown as LegalFrontMatter,
    body: source.slice(frontMatter[0].length),
    placeholders,
  };
};

export const versionPathPart = (version: string): string => `v${version.replace(/\./g, '-')}`;

export const stableHeadingId = (heading: string): string => {
  const normalized = heading.trim();
  const clause = normalized.match(/^(\d+)(?:\.|\s|$)/);
  if (clause) return `clause-${clause[1]}`;

  const annex = normalized.match(/^Annex\s+(\d+)/i);
  if (annex) return `annex-${annex[1]}`;

  return normalized
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

export const stableClauseId = (text: string): string | undefined => {
  const clause = text.trim().match(/^(\d+(?:\.\d+)+)\s/);
  return clause ? `clause-${clause[1].replace(/\./g, '-')}` : undefined;
};
