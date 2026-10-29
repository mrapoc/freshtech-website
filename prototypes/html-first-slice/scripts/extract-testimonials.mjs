import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTestimonialData } from './lib/testimonial-reader.mjs';
import {
  FIXTURE_MODE,
  TESTIMONIALS_FIXTURE_ENV,
  buildTestimonialData,
  renderTestimonialsModule,
  resolveTestimonialsFixtureMode,
} from './lib/testimonial-fixture.mjs';

// Extracts the testimonials, testimonialCategories and partnerLogos literals
// from data/content.ts into the gitignored generated module. Only those three
// top-level declarations are read; the rest of the file is parsed but never
// projected. The log prints counts only, never names, quotes or logo URLs.
//
// With TESTIMONIALS_FIXTURE=1 the generated module is built from the pure
// synthetic fixture instead and data/content.ts is never opened. Any other
// non-empty value is an error: the mode is never guessed.
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectDir, '..', '..', 'data', 'content.ts');
const outputPath = resolve(projectDir, 'src', 'generated', 'testimonials-data.mjs');

const mode = resolveTestimonialsFixtureMode(process.env[TESTIMONIALS_FIXTURE_ENV]);
const readSource = async () => readTestimonialData('data/content.ts', await readFile(sourcePath, 'utf8'));
const data = await buildTestimonialData(mode, { readSource });

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, renderTestimonialsModule(data), 'utf8');
const categoryCount = Object.keys(data.testimonialCategories).length - 1;
const origin = mode === FIXTURE_MODE ? `the synthetic fixture (${TESTIMONIALS_FIXTURE_ENV}=1, source not read)` : sourcePath;
console.log(`Extracted ${data.testimonials.length} testimonials across ${categoryCount} named categories and ${data.partnerLogos.length} partner logos from ${origin}`);
