import { ALL_CATEGORY, validateCategories, validatePartnerLogos, validateTestimonials } from './testimonial-reader.mjs';

// Pure synthetic testimonial fixture for test builds. Nothing in this module
// reads data/content.ts or any generated module: every record below is made
// up in code, unmistakably labelled as synthetic, and shaped exactly like the
// projection testimonial-reader.mjs produces from the real source.
//
// The fixture is selected only by TESTIMONIALS_FIXTURE=1. Any other non-empty
// value is an error rather than a silent fall back to either mode.

export const TESTIMONIALS_FIXTURE_ENV = 'TESTIMONIALS_FIXTURE';
export const FIXTURE_MODE = 'fixture';
export const SOURCE_MODE = 'source';

// Reserved DOM attribute that marks fixture-rendered markup. Any element that
// carries it, whatever the value or case, fails the emitted HTML quality gate
// and the preview packager so a fixture build can never be published.
export const TESTIMONIALS_FIXTURE_ATTRIBUTE = 'data-testimonials-fixture';

export const FIXTURE_CATEGORY_KEYS = Object.freeze(['speed', 'reliability', 'proactive', 'value']);
export const FIXTURE_REVIEW_COUNT = 8;
export const FIXTURE_LOGO_COUNT = 14;
export const FIXTURE_LOGO_PATH_PREFIX = '/synthetic-fixture/logos/';

const FIXTURE_CATEGORY_LABELS = Object.freeze({
  [ALL_CATEGORY]: 'All synthetic fixture reviews',
  speed: 'Synthetic speed fixture',
  reliability: 'Synthetic reliability fixture',
  proactive: 'Synthetic proactive fixture',
  value: 'Synthetic value fixture',
});

const FIXTURE_TOPICS = Object.freeze({
  speed: 'response time placeholder',
  reliability: 'uptime placeholder',
  proactive: 'monitoring placeholder',
  value: 'pricing placeholder',
});

const ORDINALS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

// The first review is deliberately long (at least FIXTURE_LONG_QUOTE_MIN_LENGTH
// characters) so layouts are exercised with a realistic wall of ordinary long
// words and punctuation. It is still unmistakably synthetic placeholder text.
export const FIXTURE_LONG_QUOTE_MIN_LENGTH = 260;
const FIXTURE_LONG_QUOTE_TAIL =
  ' This deliberately extended synthetic placeholder paragraph exists purely to exercise layout,' +
  ' wrapping, and truncation behaviour: it contains ordinary, unremarkable, multi-syllable vocabulary;' +
  ' commas, semicolons, colons, and full stops; and absolutely no customer, source, or generated material whatsoever.';

// Chooses the extraction mode from the raw environment value. Unset or empty
// means the real source; exactly "1" means the fixture; anything else fails.
export function resolveTestimonialsFixtureMode(value) {
  if (value === undefined || value === '') return SOURCE_MODE;
  if (value === '1') return FIXTURE_MODE;
  throw new Error(`${TESTIMONIALS_FIXTURE_ENV} must be unset or exactly "1", got ${JSON.stringify(value)}`);
}

// Builds fresh synthetic records on every call. The output is validated with
// the same reader validators the real extraction uses, so the fixture can
// never drift from the shape the components expect.
export function syntheticTestimonialData() {
  const testimonials = [];
  for (let index = 0; index < FIXTURE_REVIEW_COUNT; index += 1) {
    const category = FIXTURE_CATEGORY_KEYS[index % FIXTURE_CATEGORY_KEYS.length];
    const number = index + 1;
    testimonials.push({
      quote: `Synthetic fixture review ${number} of ${FIXTURE_REVIEW_COUNT}: ${FIXTURE_TOPICS[category]} text. Not a customer quote.${index === 0 ? FIXTURE_LONG_QUOTE_TAIL : ''}`,
      name: `Synthetic Reviewer ${ORDINALS[index]}`,
      company: `Fixture Company ${ORDINALS[index]} (synthetic)`,
      category,
    });
  }
  const partnerLogos = [];
  for (let index = 0; index < FIXTURE_LOGO_COUNT; index += 1) {
    const number = String(index + 1).padStart(2, '0');
    partnerLogos.push({
      src: `${FIXTURE_LOGO_PATH_PREFIX}fixture-logo-${number}.svg`,
      alt: `Synthetic fixture logo ${index + 1} of ${FIXTURE_LOGO_COUNT}`,
    });
  }
  const testimonialCategories = validateCategories({ ...FIXTURE_CATEGORY_LABELS });
  return {
    testimonials: validateTestimonials(testimonials, testimonialCategories),
    testimonialCategories,
    partnerLogos: validatePartnerLogos(partnerLogos),
    testimonialsFixture: true,
  };
}

// Selects the data for one extraction. `readSource` is only ever invoked in
// source mode, so a fixture extraction cannot touch the customer file even if
// the injected reader would.
export async function buildTestimonialData(mode, { readSource }) {
  if (mode === FIXTURE_MODE) return syntheticTestimonialData();
  if (mode !== SOURCE_MODE) throw new Error(`Unknown testimonial extraction mode ${JSON.stringify(mode)}`);
  if (typeof readSource !== 'function') throw new Error('Source mode requires a readSource function');
  const { testimonials, testimonialCategories, partnerLogos } = await readSource();
  return { testimonials, testimonialCategories, partnerLogos, testimonialsFixture: false };
}

export const FIXTURE_MODULE_BANNER = [
  '// GENERATED SYNTHETIC FIXTURE. Do not edit and never publish.',
  `// ${TESTIMONIALS_FIXTURE_ENV}=1 was set when this module was generated: every record`,
  '// below is synthetic test data, not a customer record, and data/content.ts',
  '// was not read. Components rendering it must mark their markup with the',
  `// reserved ${TESTIMONIALS_FIXTURE_ATTRIBUTE} attribute so quality and packaging gates reject it.`,
].join('\n');

export const SOURCE_MODULE_BANNER = '// Generated from data/content.ts. Do not edit. Records are inherited parity data, not newly verified copy.';

// Renders the generated module text. Both modes export the same names plus
// the `testimonialsFixture` boolean so consumers can assert on it.
export function renderTestimonialsModule({ testimonials, testimonialCategories, partnerLogos, testimonialsFixture }) {
  if (typeof testimonialsFixture !== 'boolean') throw new Error('testimonialsFixture must be a boolean');
  return `${testimonialsFixture ? FIXTURE_MODULE_BANNER : SOURCE_MODULE_BANNER}\n` +
    `export const testimonialsFixture = ${testimonialsFixture};\n` +
    `export const testimonials = ${JSON.stringify(testimonials, null, 2)};\n` +
    `// Tab key order is the source object's key order; "${ALL_CATEGORY}" is the default tab.\n` +
    `export const testimonialCategories = ${JSON.stringify(testimonialCategories, null, 2)};\n` +
    `export const partnerLogos = ${JSON.stringify(partnerLogos, null, 2)};\n`;
}
