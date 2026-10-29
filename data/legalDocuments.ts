import legalPages from '../content/legal-pages.json';
import { parseLegalDocument, versionPathPart } from '../utils/legalDocuments';

const rawDocuments = import.meta.glob('../content/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export const legalDocuments = Object.entries(rawDocuments).map(([path, source]) => ({
  fileName: path.split('/').pop() as string,
  ...parseLegalDocument(source, path),
}));

export type LegalSlug = keyof typeof legalPages.current;

export const getLegalDocument = (slug: LegalSlug, requestedVersion?: string) => {
  if (!requestedVersion) {
    const currentFile = legalPages.current[slug];
    return legalDocuments.find(document => document.fileName === currentFile);
  }

  return legalDocuments.find(
    document =>
      document.metadata.slug === slug &&
      document.metadata.version &&
      versionPathPart(document.metadata.version) === requestedVersion
  );
};

export const addVersionHistoryLinks = (body: string, slug: LegalSlug): string =>
  body.replace(
    /^(\|\s*)(\d+\.\d+)(\s*\|.*)$/gm,
    (_row, start: string, version: string, rest: string) =>
      `${start}[${version}](/${slug}/${versionPathPart(version)})${rest}`
  );
