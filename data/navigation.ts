// Lightweight navigation projection of the editorial catalogue.
//
// In development, tests and type checking this derives the labels directly
// from data/content.ts so there is a single source of truth. In production
// builds scripts/content-chunks.mjs replaces this module with the same values
// as literals parsed from the catalogue source, so the layout chrome no longer
// pulls the full industry and problem page records into the eager bundle.
// scripts/navigation-links.test.ts asserts both projections stay identical.
import { industryPages, problemPages } from './content';

export interface NavigationLink {
  slug: string;
  h1: string;
}

const project = (pages: Record<string, { slug: string; h1: string }>): NavigationLink[] =>
  Object.values(pages).map(({ slug, h1 }) => ({ slug, h1 }));

export const industryNavigation: NavigationLink[] = project(industryPages);
export const problemNavigation: NavigationLink[] = project(problemPages);
