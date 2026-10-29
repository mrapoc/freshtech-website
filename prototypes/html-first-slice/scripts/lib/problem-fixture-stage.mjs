import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, parse as parsePath, relative, resolve, sep } from 'node:path';
import { FIXTURE_LOGO_COUNT, FIXTURE_LOGO_PATH_PREFIX, TESTIMONIALS_FIXTURE_ATTRIBUTE, renderTestimonialsModule, syntheticTestimonialData } from './testimonial-fixture.mjs';

// Stages a minimal, self-contained Astro project that builds the unchanged
// production root-slug dispatcher (src/pages/[slug].astro) with both of its
// families, the service-location, Problem and comparison branches, against
// synthetic testimonials. Everything copied is named in an explicit constant
// allowlist below: there is no directory copy and no filesystem walk of the
// source project. The only generated modules touched are the four public-only
// projections in PROJECTION_MODULES; the real testimonials module is never
// read, because the staged one is rendered fresh from the synthetic fixture.
// The output directory must be new; nothing here deletes anything.

export const FIXTURE_BUILD_SCRIPT = 'build:fixture';
export const FIXTURE_OUTPUT_DIR = 'dist-synthetic';
export const FIXTURE_BUILD_COMMAND = `astro build --outDir ${FIXTURE_OUTPUT_DIR}`;
export const MANIFEST_NAME = 'manifest.json';
export const PACKAGE_JSON = 'package.json';
export const PACKAGE_LOCK = 'package-lock.json';
export const GENERATED_DIR = 'src/generated';
export const TESTIMONIALS_MODULE = 'testimonials-data.mjs';
export const DISPATCHER = 'src/pages/[slug].astro';

// The four public-only generated projections the dispatcher and its site
// chrome import. Copied by exact name only; the generated directory is never
// listed or globbed, so any other module there (the real testimonials or a
// future private projection) cannot be staged by accident.
export const PROJECTION_MODULES = Object.freeze(['problems-data.mjs', 'service-locations-data.mjs', 'navigation-data.mjs', 'comparisons-data.mjs']);

// Exact transitive dependency set of src/pages/[slug].astro, project-relative,
// copied byte for byte. Derived by reading the dispatcher and following its
// component, layout, lib, style and script imports (including the client
// scripts enhance.ts loads on demand).
export const SOURCE_DEPENDENCIES = Object.freeze([
  PACKAGE_LOCK,
  'astro.config.mjs',
  'tsconfig.json',
  DISPATCHER,
  'src/layouts/BaseLayout.astro',
  'src/components/ComparisonIcon.astro',
  'src/components/ComparisonPage.astro',
  'src/components/ContactForm.astro',
  'src/components/CookieConsent.astro',
  'src/components/CyberEssentialsBadge.astro',
  'src/components/InlineMarkdown.astro',
  'src/components/ProblemIcon.astro',
  'src/components/ProblemPage.astro',
  'src/components/PrototypeBanner.astro',
  'src/components/RichInline.astro',
  'src/components/RichText.astro',
  'src/components/ServiceLocationIcon.astro',
  'src/components/ServiceLocationPage.astro',
  'src/components/SiteFooter.astro',
  'src/components/SiteNav.astro',
  'public/images/fresh-tech-logo.webp',
  'public/images/fresh-tech-logo-white.webp',
  'src/components/SourceContact.astro',
  'src/components/SourceTestimonials.astro',
  'src/lib/comparison-display.mjs',
  'src/lib/comparison-seo.mjs',
  'src/lib/inline-markdown.mjs',
  'src/lib/problem-display.mjs',
  'src/lib/problem-icons.mjs',
  'src/lib/problem-seo.mjs',
  'src/lib/public-metrics.mjs',
  'src/lib/rich-text.mjs',
  'src/lib/service-location-display.mjs',
  'src/lib/service-location-seo.mjs',
  'src/lib/service-seo.mjs',
  'src/lib/site-mode.mjs',
  'src/lib/social-image.mjs',
  'src/lib/testimonial-display.mjs',
  'src/scripts/consent.ts',
  'src/scripts/contact-form.ts',
  'src/scripts/email-checker.ts',
  'src/scripts/enhance.ts',
  'src/scripts/live-metrics.ts',
  'src/scripts/problem-view.ts',
  'src/scripts/testimonials.ts',
  'src/styles/comparisons.css',
  'src/styles/contact-form.css',
  'src/styles/global.css',
  'src/styles/problems.css',
  'src/styles/service-locations.css',
  'src/styles/source-contact.css',
  'src/styles/source-testimonials.css',
]);

// The six self-hosted font subsets referenced by global.css, problems.css and
// service-locations.css (project-relative, served from /fonts/).
export const FONT_ASSETS = Object.freeze([
  'public/fonts/archivo-v25-latin.woff2',
  'public/fonts/archivo-v25-latin-ext.woff2',
  'public/fonts/archivo-narrow-v35-latin.woff2',
  'public/fonts/archivo-narrow-v35-latin-ext.woff2',
  'public/fonts/bungee-latin.woff2',
  'public/fonts/bungee-latin-ext.woff2',
]);

// Font licences and provenance notes, repository-root relative, staged at the
// same relative path so the licence sits beside the fonts it covers.
export const FONT_LICENCES = Object.freeze([
  'public/fonts/archivo/OFL.txt',
  'public/fonts/archivo/PROVENANCE.md',
  'public/fonts/archivo-narrow/OFL.txt',
  'public/fonts/archivo-narrow/PROVENANCE.md',
  'public/fonts/bungee/OFL.txt',
  'public/fonts/bungee/PROVENANCE.md',
]);

export const PURPOSES = Object.freeze({
  sourceDependency: 'source-dependency',
  packageLock: 'package-lock',
  fontAsset: 'font-asset',
  fontLicence: 'font-licence',
  publicProjection: 'public-projection',
  syntheticTestimonials: 'synthetic-testimonials',
  syntheticLogo: 'synthetic-logo',
  stagedPackageJson: 'staged-package-json',
  stagedGitignore: 'staged-gitignore',
});

const PORTABLE_COMPONENT = /^[A-Za-z0-9._\-[\]]+$/;

// Allowlist entries are constants, but they are still checked as untrusted
// paths so an edit can never introduce traversal, absolute or odd names.
export function assertSafeRelativePath(entry) {
  if (typeof entry !== 'string' || !entry || isAbsolute(entry) || entry.startsWith('/') || entry.includes('\\') || entry.includes(':') || /[\x00-\x1f\x7f]/.test(entry)) {
    throw new Error(`Unsafe staged path: ${String(entry)}`);
  }
  for (const component of entry.split('/')) {
    if (!component || component === '.' || component === '..' || !PORTABLE_COMPONENT.test(component)) throw new Error(`Unsupported staged path: ${entry}`);
  }
}

// Resolves root/entry component by component with lstat: every component must
// exist, none may be a symlink, and the leaf must be a regular file.
export async function assertRegularSourceFile(root, entry, label = 'source file') {
  assertSafeRelativePath(entry);
  const components = entry.split('/');
  let current = root;
  for (const [index, component] of components.entries()) {
    current = join(current, component);
    let info;
    try {
      info = await lstat(current);
    } catch (error) {
      if (error.code === 'ENOENT') throw new Error(`Required ${label} is missing: ${entry}`);
      throw error;
    }
    if (info.isSymbolicLink()) throw new Error(`Required ${label} crosses a symlink: ${entry}`);
    if (index < components.length - 1 && !info.isDirectory()) throw new Error(`Required ${label} parent is not a directory: ${entry}`);
    if (index === components.length - 1 && !info.isFile()) throw new Error(`Required ${label} is not a regular file: ${entry}`);
  }
  return current;
}

const isInside = (parent, child) => {
  const between = relative(parent, child);
  return between === '' || (!between.startsWith('..') && !isAbsolute(between));
};

// The output directory must not exist yet, must sit outside the source project
// (so the source dist and generated modules cannot be touched), must have an
// existing real parent directory, and no ancestor may be a symlink.
export async function assertNewOutputDir(outDir, { projectDir }) {
  if (typeof outDir !== 'string' || !outDir.trim()) throw new Error('An output directory is required (--out <new-directory>)');
  const out = resolve(outDir);
  const project = resolve(projectDir);
  if (isInside(project, out) || isInside(out, project)) throw new Error(`Output directory must be outside the source project: ${out}`);
  const { root } = parsePath(out);
  if (out === root) throw new Error(`Output directory cannot be a filesystem root: ${out}`);
  const parent = dirname(out);
  let current = root;
  for (const component of relative(root, parent).split(sep).filter(Boolean)) {
    current = join(current, component);
    let info;
    try {
      info = await lstat(current);
    } catch (error) {
      if (error.code === 'ENOENT') throw new Error(`Output parent directory does not exist: ${parent}`);
      throw error;
    }
    if (info.isSymbolicLink()) throw new Error(`Output path resolves through a symlink: ${current}`);
    if (!info.isDirectory()) throw new Error(`Output parent is not a directory: ${current}`);
  }
  try {
    await lstat(out);
  } catch (error) {
    if (error.code === 'ENOENT') return out;
    throw error;
  }
  throw new Error(`Output directory already exists (refusing to reuse or delete it): ${out}`);
}

// Staged package.json: the source name, version, module type, engines and
// exact dependency sets (so the copied package-lock.json still matches for
// npm ci), with every script replaced by the single fixture build. No release,
// package or deploy script can exist in the staged project.
export function renderStagedPackageJson(sourceText) {
  const source = JSON.parse(sourceText);
  for (const key of ['name', 'version', 'dependencies']) {
    if (!(key in source)) throw new Error(`Source package.json is missing "${key}"`);
  }
  const staged = {
    name: source.name,
    private: true,
    version: source.version,
    description: 'Synthetic Problem fixture staging. Local build only; never publish or deploy.',
    syntheticFixture: true,
    type: source.type,
    engines: source.engines,
    scripts: { [FIXTURE_BUILD_SCRIPT]: FIXTURE_BUILD_COMMAND },
    dependencies: source.dependencies,
    devDependencies: source.devDependencies,
  };
  for (const key of Object.keys(staged)) if (staged[key] === undefined) delete staged[key];
  return `${JSON.stringify(staged, null, 2)}\n`;
}

export const STAGED_GITIGNORE = `node_modules/\n${FIXTURE_OUTPUT_DIR}/\n`;

// Obviously synthetic placeholder logo. The label is drawn as text so the
// rendered page reads as fixture data at a glance.
export function renderSyntheticLogoSvg(number, total = FIXTURE_LOGO_COUNT) {
  if (!Number.isInteger(number) || number < 1 || number > total) throw new Error(`Synthetic logo number out of range: ${number}`);
  const label = `Synthetic fixture logo ${number} of ${total}`;
  const padded = String(number).padStart(2, '0');
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 80" width="260" height="80" role="img" aria-labelledby="t">',
    `<title id="t">${label}</title>`,
    '<rect x="2" y="2" width="256" height="76" fill="#e6e6e6" stroke="#555" stroke-width="4" stroke-dasharray="8 6"/>',
    '<text x="130" y="34" text-anchor="middle" font-family="monospace" font-size="16" font-weight="700" fill="#333">SYNTHETIC FIXTURE</text>',
    `<text x="130" y="60" text-anchor="middle" font-family="monospace" font-size="13" fill="#333">LOGO ${padded} / ${total} (NOT A PARTNER)</text>`,
    '</svg>\n',
  ].join('');
}

const sha256 = body => createHash('sha256').update(body).digest('hex');

async function stagedDestination(out, entry) {
  assertSafeRelativePath(entry);
  const destination = join(out, ...entry.split('/'));
  await mkdir(dirname(destination), { recursive: true });
  return destination;
}

async function record(files, destination, entry, purpose) {
  const body = await readFile(destination);
  files.push({ path: entry, bytes: body.length, sha256: sha256(body), purpose });
}

async function stageCopy(out, files, from, entry, purpose) {
  const destination = await stagedDestination(out, entry);
  await copyFile(from, destination, constants.COPYFILE_EXCL);
  await record(files, destination, entry, purpose);
}

async function stageWrite(out, files, entry, content, purpose) {
  const destination = await stagedDestination(out, entry);
  await writeFile(destination, content, { flag: 'wx' });
  await record(files, destination, entry, purpose);
}

// Every allowlist entry must be a member of the exported approved constant;
// an override may narrow a list (tests use fake roots holding the approved
// names) but can never introduce a path that is not already approved.
const assertApprovedSubset = (list, approved, label) => {
  if (!Array.isArray(list) || !list.length) throw new Error('Every staging allowlist must be a non-empty array');
  if (new Set(list).size !== list.length) throw new Error('A staging allowlist contains a duplicate path');
  for (const entry of list) {
    if (!approved.includes(entry)) throw new Error(`Refusing to stage a path outside the approved ${label} allowlist: ${String(entry)}`);
  }
};

// Plans and validates every source path first (so a missing dependency fails
// before the output directory exists), then creates the new directory and
// stages: the allowlisted sources, fonts and licences, the four public
// projections, a freshly rendered synthetic testimonials module, the synthetic
// logo SVGs, the fixture-only package.json and .gitignore, and manifest.json.
// Overrides are validated against the approved constants before anything is
// created: dependencies, fonts and licences may only be subsets of theirs, and
// projections must be exactly the PROJECTION_MODULES set, so no testimonials,
// case-study or customer module can ever be named through an override.
export async function stageProblemFixture({
  projectDir,
  repoDir,
  outDir,
  dependencies = SOURCE_DEPENDENCIES,
  fontAssets = FONT_ASSETS,
  fontLicences = FONT_LICENCES,
  projections = PROJECTION_MODULES,
}) {
  if (typeof projectDir !== 'string' || typeof repoDir !== 'string') throw new Error('stageProblemFixture needs projectDir and repoDir');
  const project = resolve(projectDir);
  const repo = resolve(repoDir);
  assertApprovedSubset(dependencies, SOURCE_DEPENDENCIES, 'source dependency');
  assertApprovedSubset(fontAssets, FONT_ASSETS, 'font asset');
  assertApprovedSubset(fontLicences, FONT_LICENCES, 'font licence');
  if (!dependencies.includes(DISPATCHER)) throw new Error(`The dependency allowlist must include the dispatcher ${DISPATCHER}`);
  if (!dependencies.includes(PACKAGE_LOCK)) throw new Error(`The dependency allowlist must include ${PACKAGE_LOCK}`);
  if (!Array.isArray(projections) || !projections.length) throw new Error('Every staging allowlist must be a non-empty array');
  if (new Set(projections).size !== projections.length) throw new Error('A staging allowlist contains a duplicate path');
  for (const name of projections) {
    if (!PROJECTION_MODULES.includes(name)) throw new Error(`Refusing to stage generated module by that name: ${String(name)}`);
  }
  if (projections.length !== PROJECTION_MODULES.length) throw new Error(`Projections must be exactly the ${PROJECTION_MODULES.length} public modules in PROJECTION_MODULES`);

  const plan = [];
  for (const entry of dependencies) {
    plan.push({ from: await assertRegularSourceFile(project, entry, 'source dependency'), entry, purpose: entry === PACKAGE_LOCK ? PURPOSES.packageLock : PURPOSES.sourceDependency });
  }
  for (const entry of fontAssets) plan.push({ from: await assertRegularSourceFile(project, entry, 'font asset'), entry, purpose: PURPOSES.fontAsset });
  for (const entry of fontLicences) plan.push({ from: await assertRegularSourceFile(repo, entry, 'font licence'), entry, purpose: PURPOSES.fontLicence });
  for (const name of projections) {
    const entry = `${GENERATED_DIR}/${name}`;
    plan.push({ from: await assertRegularSourceFile(project, entry, 'public projection module'), entry, purpose: PURPOSES.publicProjection });
  }
  const packageJsonPath = await assertRegularSourceFile(project, PACKAGE_JSON, 'package manifest');
  const stagedPackageJson = renderStagedPackageJson(await readFile(packageJsonPath, 'utf8'));

  // Synthetic testimonials are built in memory before anything is written.
  // syntheticTestimonialData never reads a file.
  const synthetic = syntheticTestimonialData();
  if (synthetic.testimonialsFixture !== true) throw new Error('Synthetic testimonial data must be marked as the fixture');
  const testimonialsModule = renderTestimonialsModule(synthetic);
  const logos = synthetic.partnerLogos.map((logo, index) => {
    if (!logo.src.startsWith(FIXTURE_LOGO_PATH_PREFIX)) throw new Error(`Synthetic logo ${index + 1} is not under ${FIXTURE_LOGO_PATH_PREFIX}`);
    const entry = `public${logo.src}`;
    assertSafeRelativePath(entry);
    return { entry, svg: renderSyntheticLogoSvg(index + 1, synthetic.partnerLogos.length) };
  });

  const out = await assertNewOutputDir(outDir, { projectDir: project });
  await mkdir(out);

  const files = [];
  for (const item of plan) await stageCopy(out, files, item.from, item.entry, item.purpose);
  await stageWrite(out, files, `${GENERATED_DIR}/${TESTIMONIALS_MODULE}`, testimonialsModule, PURPOSES.syntheticTestimonials);
  for (const logo of logos) await stageWrite(out, files, logo.entry, logo.svg, PURPOSES.syntheticLogo);
  await stageWrite(out, files, PACKAGE_JSON, stagedPackageJson, PURPOSES.stagedPackageJson);
  await stageWrite(out, files, '.gitignore', STAGED_GITIGNORE, PURPOSES.stagedGitignore);

  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const counts = {
    files: files.length,
    sourceDependencies: dependencies.length,
    fontAssets: fontAssets.length,
    fontLicences: fontLicences.length,
    projections: projections.length,
    testimonials: synthetic.testimonials.length,
    testimonialCategories: Object.keys(synthetic.testimonialCategories).length,
    syntheticLogos: logos.length,
  };
  const manifest = {
    fixture: true,
    testimonialsFixture: true,
    purpose: 'Synthetic Problem build staging for the root-slug dispatcher (service-location, Problem and comparison branches). Local fixture only; never publish.',
    marker: TESTIMONIALS_FIXTURE_ATTRIBUTE,
    buildScript: FIXTURE_BUILD_SCRIPT,
    buildCommand: FIXTURE_BUILD_COMMAND,
    outputDir: FIXTURE_OUTPUT_DIR,
    counts,
    files,
  };
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(join(out, MANIFEST_NAME), manifestText, { flag: 'wx' });
  return { outDir: out, counts, manifestSha256: sha256(manifestText) };
}
