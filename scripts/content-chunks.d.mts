export function splitContent(source: string): Map<string, string>;
export const navigationRecords: string[];
export function navigationLinks(source: string): Record<string, { slug: string; h1: string }[]>;
export function navigationModule(source: string): string;
export function contentChunksPlugin(): {
  name: string;
  apply: 'build';
  enforce: 'pre';
  configResolved(config: { root: string }): void;
  buildEnd(error?: Error): void;
  transform(code: string, id: string): { code: string; map: null; moduleSideEffects: false } | null;
  resolveId(id: string): string | null;
  load(id: string): { code: string; moduleSideEffects: false } | null;
};
