import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readdir, readFile, realpath, rm, rmdir, symlink, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { parseArgs } from './stage-problem-fixture.mjs';
import {
  DISPATCHER,
  FIXTURE_BUILD_COMMAND,
  FIXTURE_BUILD_SCRIPT,
  FONT_ASSETS,
  FONT_LICENCES,
  GENERATED_DIR,
  MANIFEST_NAME,
  PACKAGE_LOCK,
  PROJECTION_MODULES,
  PURPOSES,
  SOURCE_DEPENDENCIES,
  TESTIMONIALS_MODULE,
  assertSafeRelativePath,
  renderStagedPackageJson,
  renderSyntheticLogoSvg,
  stageProblemFixture,
} from './lib/problem-fixture-stage.mjs';
import { FIXTURE_LOGO_COUNT, FIXTURE_REVIEW_COUNT, TESTIMONIALS_FIXTURE_ATTRIBUTE, renderTestimonialsModule, syntheticTestimonialData } from './lib/testimonial-fixture.mjs';

// Every test runs against a fake project and repository tree in a temporary
// directory; nothing here touches the real prototype, its generated modules or
// data/content.ts. The fake tree carries decoys (a customer-record module, a
// private profile and a source dist) that must never reach the staged output,
// and its testimonials module is a DIRECTORY, so any attempt to read or copy
// it fails loudly.
const PRIVATE_SENTINEL = 'PRIVATE_CUSTOMER_SENTINEL_DO_NOT_STAGE';
const SOURCE_PACKAGE_JSON = {
  name: 'fake-prototype', private: true, version: '0.1.0', type: 'module', engines: { node: '>=22.12.0' },
  scripts: { build: 'node scripts/build.mjs', 'package:worker': 'node scripts/package-worker-source.mjs', deploy: 'never' },
  dependencies: { astro: '7.3.2' }, devDependencies: { typescript: '5.9.3' },
};

const sha256 = body => createHash('sha256').update(body).digest('hex');

async function put(root, entry, content) {
  const target = join(root, ...entry.split('/'));
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, content);
}

async function fakeRoots(t) {
  const base = await realpath(await mkdtemp(join(tmpdir(), 'problem-fixture-stage-')));
  t.after(() => rm(base, { recursive: true, force: true }));
  const projectDir = join(base, 'project');
  const repoDir = join(base, 'repo');
  for (const entry of SOURCE_DEPENDENCIES) await put(projectDir, entry, entry === PACKAGE_LOCK ? '{ "name": "fake-prototype", "lockfileVersion": 3 }\n' : `/* fake source ${entry} */\n`);
  await put(projectDir, 'package.json', `${JSON.stringify(SOURCE_PACKAGE_JSON, null, 2)}\n`);
  for (const entry of FONT_ASSETS) await put(projectDir, entry, Buffer.from([0x77, 0x4f, 0x46, 0x32, entry.length]));
  for (const entry of FONT_LICENCES) await put(repoDir, entry, `fake licence ${entry}\n`);
  for (const name of PROJECTION_MODULES) await put(projectDir, `${GENERATED_DIR}/${name}`, `export const projection = ${JSON.stringify(name)};\n`);
  await mkdir(join(projectDir, GENERATED_DIR, TESTIMONIALS_MODULE), { recursive: true });
  await put(projectDir, `${GENERATED_DIR}/customer-records-data.mjs`, `export const secret = ${JSON.stringify(PRIVATE_SENTINEL)};\n`);
  await put(projectDir, 'private/profile.json', `{ "secret": ${JSON.stringify(PRIVATE_SENTINEL)} }\n`);
  await put(projectDir, 'dist/slow-computers/index.html', '<main data-problem-page="slow-computers">source dist</main>\n');
  await put(repoDir, 'data/content.ts', `export const testimonials = [${JSON.stringify(PRIVATE_SENTINEL)}];\n`);
  return { base, projectDir, repoDir, outDir: join(base, 'staged') };
}

async function listFiles(root) {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  return entries.filter(entry => entry.isFile()).map(entry => relative(root, join(entry.parentPath ?? entry.path, entry.name)).split(sep).join('/')).sort();
}

async function snapshot(root) {
  const files = await listFiles(root);
  return Object.fromEntries(await Promise.all(files.map(async file => [file, sha256(await readFile(join(root, ...file.split('/'))))])));
}

const expectedStagedPaths = () => [
  ...SOURCE_DEPENDENCIES,
  ...FONT_ASSETS,
  ...FONT_LICENCES,
  ...PROJECTION_MODULES.map(name => `${GENERATED_DIR}/${name}`),
  `${GENERATED_DIR}/${TESTIMONIALS_MODULE}`,
  ...syntheticTestimonialData().partnerLogos.map(logo => `public${logo.src}`),
  'package.json',
  '.gitignore',
  MANIFEST_NAME,
].sort();

test('allowlists are explicit, safe, duplicate-free and never name generated, dist or source data', () => {
  for (const list of [SOURCE_DEPENDENCIES, FONT_ASSETS, FONT_LICENCES]) {
    assert.ok(Object.isFrozen(list) && list.length > 0);
    assert.equal(new Set(list).size, list.length);
    for (const entry of list) {
      assert.doesNotThrow(() => assertSafeRelativePath(entry), entry);
      assert.ok(!entry.startsWith('src/generated/') && !entry.startsWith('dist') && !entry.includes('content.ts') && !/customer|private/i.test(entry), entry);
    }
  }
  assert.ok(SOURCE_DEPENDENCIES.includes(DISPATCHER));
  assert.ok(SOURCE_DEPENDENCIES.includes(PACKAGE_LOCK));
  assert.ok(!SOURCE_DEPENDENCIES.includes('package.json'), 'package.json is rendered, not copied');
  assert.deepEqual([...PROJECTION_MODULES], ['problems-data.mjs', 'service-locations-data.mjs', 'navigation-data.mjs', 'comparisons-data.mjs']);
  assert.equal(FONT_ASSETS.length, 6);
  assert.equal(FONT_LICENCES.length, 6);
  for (const bad of ['../x', 'src/../x', '/abs', 'C:/abs', 'a\\b', 'src/./x', '', 'a b']) assert.throws(() => assertSafeRelativePath(bad), bad);
});

test('stages exactly the allowlisted files plus the synthetic modules and leaves the source tree untouched', async t => {
  const { projectDir, repoDir, outDir } = await fakeRoots(t);
  const before = await snapshot(projectDir);
  const result = await stageProblemFixture({ projectDir, repoDir, outDir });
  assert.equal(result.outDir, outDir);
  assert.deepEqual(await listFiles(outDir), expectedStagedPaths());
  assert.deepEqual(await snapshot(projectDir), before, 'source project (dist and generated modules included) is unchanged');
  for (const entry of SOURCE_DEPENDENCIES) {
    assert.deepEqual(await readFile(join(outDir, ...entry.split('/'))), await readFile(join(projectDir, ...entry.split('/'))), `${entry} copied byte for byte`);
  }
  for (const entry of FONT_LICENCES) assert.deepEqual(await readFile(join(outDir, ...entry.split('/'))), await readFile(join(repoDir, ...entry.split('/'))));
  const stagedText = (await Promise.all((await listFiles(outDir)).map(file => readFile(join(outDir, ...file.split('/')), 'utf8')))).join('\n');
  assert.ok(!stagedText.includes(PRIVATE_SENTINEL), 'no decoy content reached the staged project');
  assert.deepEqual(result.counts, {
    files: expectedStagedPaths().length - 1,
    sourceDependencies: SOURCE_DEPENDENCIES.length,
    fontAssets: 6,
    fontLicences: 6,
    projections: 4,
    testimonials: FIXTURE_REVIEW_COUNT,
    testimonialCategories: 5,
    syntheticLogos: FIXTURE_LOGO_COUNT,
  });
});

test('the staged testimonials module is rendered from the synthetic fixture and the source module is never read', async t => {
  const { projectDir, repoDir, outDir } = await fakeRoots(t);
  // The fake source testimonials module is a directory: any read or copy of it
  // would have thrown EISDIR, so a successful stage proves it was not touched.
  assert.ok((await lstat(join(projectDir, GENERATED_DIR, TESTIMONIALS_MODULE))).isDirectory());
  await stageProblemFixture({ projectDir, repoDir, outDir });
  const stagedModule = join(outDir, 'src', 'generated', TESTIMONIALS_MODULE);
  assert.equal(await readFile(stagedModule, 'utf8'), renderTestimonialsModule(syntheticTestimonialData()));
  const generated = await import(pathToFileURL(stagedModule).href);
  assert.equal(generated.testimonialsFixture, true);
  assert.equal(generated.testimonials.length, 8);
  assert.equal(Object.keys(generated.testimonialCategories).length, 5);
  assert.equal(generated.partnerLogos.length, 14);
  assert.ok(generated.testimonials.every(item => /synthetic/i.test(item.quote) && /synthetic/i.test(item.name)));
  const stagedGenerated = await readdir(join(outDir, 'src', 'generated'));
  assert.deepEqual(stagedGenerated.sort(), [...PROJECTION_MODULES, TESTIMONIALS_MODULE].sort(), 'only the four projections and the synthetic module are staged');
});

test('fourteen synthetic logo SVGs are staged at the fixture paths with obvious labels', async t => {
  const { projectDir, repoDir, outDir } = await fakeRoots(t);
  await stageProblemFixture({ projectDir, repoDir, outDir });
  const logos = syntheticTestimonialData().partnerLogos;
  assert.equal(logos.length, 14);
  for (const [index, logo] of logos.entries()) {
    const svg = await readFile(join(outDir, 'public', ...logo.src.split('/').filter(Boolean)), 'utf8');
    assert.equal(svg, renderSyntheticLogoSvg(index + 1));
    assert.ok(svg.startsWith('<svg') && svg.includes('SYNTHETIC FIXTURE') && svg.includes('NOT A PARTNER') && svg.includes(logo.alt), logo.src);
  }
  const logoFiles = await readdir(join(outDir, 'public', 'synthetic-fixture', 'logos'));
  assert.equal(logoFiles.length, 14);
  assert.throws(() => renderSyntheticLogoSvg(0), /out of range/);
  assert.throws(() => renderSyntheticLogoSvg(15), /out of range/);
});

test('manifest lists every staged file with bytes and SHA256, marks the fixture and names no private path', async t => {
  const { projectDir, repoDir, outDir } = await fakeRoots(t);
  const result = await stageProblemFixture({ projectDir, repoDir, outDir });
  const manifestText = await readFile(join(outDir, MANIFEST_NAME), 'utf8');
  assert.equal(sha256(manifestText), result.manifestSha256);
  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.fixture, true);
  assert.equal(manifest.testimonialsFixture, true);
  assert.equal(manifest.marker, TESTIMONIALS_FIXTURE_ATTRIBUTE);
  assert.equal(manifest.buildScript, FIXTURE_BUILD_SCRIPT);
  assert.equal(manifest.buildCommand, FIXTURE_BUILD_COMMAND);
  assert.deepEqual(manifest.counts, result.counts);
  const staged = (await listFiles(outDir)).filter(file => file !== MANIFEST_NAME);
  assert.deepEqual(manifest.files.map(file => file.path), staged, 'manifest paths are the staged files, sorted');
  for (const file of manifest.files) {
    const body = await readFile(join(outDir, ...file.path.split('/')));
    assert.equal(file.bytes, body.length, file.path);
    assert.equal(file.sha256, sha256(body), file.path);
    assert.ok(Object.values(PURPOSES).includes(file.purpose), file.path);
    assert.ok(!/customer|private|content\.ts/i.test(file.path), file.path);
  }
  const purposeOf = path => manifest.files.find(file => file.path === path).purpose;
  assert.equal(purposeOf(DISPATCHER), PURPOSES.sourceDependency);
  assert.equal(purposeOf(PACKAGE_LOCK), PURPOSES.packageLock);
  assert.equal(purposeOf(FONT_ASSETS[0]), PURPOSES.fontAsset);
  assert.equal(purposeOf(FONT_LICENCES[0]), PURPOSES.fontLicence);
  assert.equal(purposeOf(`${GENERATED_DIR}/problems-data.mjs`), PURPOSES.publicProjection);
  assert.equal(purposeOf(`${GENERATED_DIR}/${TESTIMONIALS_MODULE}`), PURPOSES.syntheticTestimonials);
  assert.equal(purposeOf('package.json'), PURPOSES.stagedPackageJson);
  assert.equal(manifest.files.filter(file => file.purpose === PURPOSES.syntheticLogo).length, 14);
  assert.ok(!manifestText.includes(PRIVATE_SENTINEL));
});

test('staged package.json carries only the fixture build script and keeps the lock-matching dependency sets', async t => {
  const { projectDir, repoDir, outDir } = await fakeRoots(t);
  await stageProblemFixture({ projectDir, repoDir, outDir });
  const staged = JSON.parse(await readFile(join(outDir, 'package.json'), 'utf8'));
  assert.deepEqual(staged.scripts, { [FIXTURE_BUILD_SCRIPT]: 'astro build --outDir dist-synthetic' });
  assert.ok(!Object.keys(staged.scripts).some(key => /deploy|package|publish|release|extract/i.test(key)));
  assert.equal(staged.private, true);
  assert.equal(staged.syntheticFixture, true);
  assert.equal(staged.name, SOURCE_PACKAGE_JSON.name);
  assert.equal(staged.version, SOURCE_PACKAGE_JSON.version);
  assert.deepEqual(staged.dependencies, SOURCE_PACKAGE_JSON.dependencies);
  assert.deepEqual(staged.devDependencies, SOURCE_PACKAGE_JSON.devDependencies);
  assert.deepEqual(await readFile(join(outDir, PACKAGE_LOCK)), await readFile(join(projectDir, PACKAGE_LOCK)));
  assert.equal(await readFile(join(outDir, '.gitignore'), 'utf8'), 'node_modules/\ndist-synthetic/\n');
  assert.throws(() => renderStagedPackageJson('{ "name": "x" }'), /missing "version"/);
});

test('refuses existing, traversing, in-project, rootless and symlinked output targets without creating anything', async t => {
  const { base, projectDir, repoDir } = await fakeRoots(t);
  const refuse = async (outDir, pattern) => {
    await assert.rejects(stageProblemFixture({ projectDir, repoDir, outDir }), pattern, outDir);
  };
  const existingDir = join(base, 'existing');
  await mkdir(existingDir);
  await refuse(existingDir, /already exists/);
  assert.deepEqual(await readdir(existingDir), [], 'existing directory was left empty');
  const existingFile = join(base, 'existing-file');
  await writeFile(existingFile, 'keep');
  await refuse(existingFile, /already exists/);
  assert.equal(await readFile(existingFile, 'utf8'), 'keep');
  await refuse(join(base, 'missing-parent', 'staged'), /parent directory does not exist/);
  await refuse(join(projectDir, 'staged'), /outside the source project/);
  await refuse(join(base, 'elsewhere', '..', 'project', 'nested'), /outside the source project/);
  await refuse(base, /already exists|outside the source project/);
  await refuse('', /output directory is required/i);
  await refuse(undefined, /output directory is required/i);
  const linkParent = join(base, 'link-parent');
  let linked = false;
  try {
    await symlink(join(base, 'repo'), linkParent, 'junction');
    linked = true;
  } catch {
    // Symlink creation is not permitted in every environment; the check is still exercised by the other targets.
  }
  if (linked) {
    await refuse(join(linkParent, 'staged'), /symlink/);
    // Remove only the link itself: rmdir drops a Windows junction, unlink a POSIX symlink.
    await rmdir(linkParent).catch(() => unlink(linkParent));
  }
  for (const name of ['staged', 'missing-parent']) await assert.rejects(lstat(join(base, name)), { code: 'ENOENT' });
});

test('a missing allowlisted source, font, licence or projection fails before the output directory is created', async t => {
  const cases = [
    ['project', 'src/lib/problem-seo.mjs', /Required source dependency is missing: src\/lib\/problem-seo\.mjs/],
    ['project', FONT_ASSETS[5], /Required font asset is missing: public\/fonts\/bungee-latin-ext\.woff2/],
    ['repo', FONT_LICENCES[1], /Required font licence is missing: public\/fonts\/archivo\/PROVENANCE\.md/],
    ['project', `${GENERATED_DIR}/navigation-data.mjs`, /Required public projection module is missing: src\/generated\/navigation-data\.mjs/],
  ];
  for (const [root, entry, pattern] of cases) {
    const { projectDir, repoDir, outDir } = await fakeRoots(t);
    await rm(join(root === 'project' ? projectDir : repoDir, ...entry.split('/')));
    await assert.rejects(stageProblemFixture({ projectDir, repoDir, outDir }), pattern);
    await assert.rejects(lstat(outDir), { code: 'ENOENT' }, `${entry}: nothing was created`);
  }
});

test('injected projection names cannot reach the testimonials module or leave the generated directory', async t => {
  const { projectDir, repoDir, outDir } = await fakeRoots(t);
  await assert.rejects(stageProblemFixture({ projectDir, repoDir, outDir, projections: [...PROJECTION_MODULES, TESTIMONIALS_MODULE] }), /Refusing to stage generated module/);
  await assert.rejects(stageProblemFixture({ projectDir, repoDir, outDir, projections: ['../lib/problem-seo.mjs'] }), /Refusing to stage generated module/);
  await assert.rejects(stageProblemFixture({ projectDir, repoDir, outDir, projections: [] }), /non-empty array/);
  await assert.rejects(stageProblemFixture({ projectDir, repoDir, outDir, dependencies: [PACKAGE_LOCK] }), /must include the dispatcher/);
  await assert.rejects(stageProblemFixture({ projectDir, repoDir, outDir, dependencies: [DISPATCHER, DISPATCHER, PACKAGE_LOCK] }), /duplicate/);
  await assert.rejects(lstat(outDir), { code: 'ENOENT' });
});

test('overrides may only name members of the approved constants and are rejected before any output is created', async t => {
  const { projectDir, repoDir, outDir } = await fakeRoots(t);
  // Every decoy below exists in the fake tree, so only the allowlist check can stop it.
  const reject = (overrides, pattern) => assert.rejects(stageProblemFixture({ projectDir, repoDir, outDir, ...overrides }), pattern, JSON.stringify(overrides));
  await reject({ dependencies: [...SOURCE_DEPENDENCIES, 'private/profile.json'] }, /outside the approved source dependency allowlist: private\/profile\.json/);
  await reject({ dependencies: [...SOURCE_DEPENDENCIES, `${GENERATED_DIR}/customer-records-data.mjs`] }, /outside the approved source dependency allowlist/);
  await reject({ dependencies: [...SOURCE_DEPENDENCIES, 'package.json'] }, /outside the approved source dependency allowlist: package\.json/);
  await reject({ dependencies: [...SOURCE_DEPENDENCIES, 'dist/slow-computers/index.html'] }, /outside the approved source dependency allowlist/);
  await reject({ fontAssets: [...FONT_ASSETS, 'private/profile.json'] }, /outside the approved font asset allowlist/);
  await reject({ fontLicences: [...FONT_LICENCES, 'data/content.ts'] }, /outside the approved font licence allowlist: data\/content\.ts/);
  await reject({ projections: ['customer-records-data.mjs'] }, /Refusing to stage generated module by that name: customer-records-data\.mjs/);
  await reject({ projections: [...PROJECTION_MODULES.slice(0, 2), 'case-studies-data.mjs'] }, /Refusing to stage generated module/);
  await reject({ projections: [...PROJECTION_MODULES.slice(0, 2), 'testimonials-data.mjs'] }, /Refusing to stage generated module/);
  await reject({ projections: ['problems-data.mjs'] }, /exactly the 4 public modules/);
  await reject({ projections: [PROJECTION_MODULES[0], PROJECTION_MODULES[0], PROJECTION_MODULES[1]] }, /duplicate/);
  await reject({ projections: 'problems-data.mjs' }, /non-empty array/);
  await assert.rejects(lstat(outDir), { code: 'ENOENT' }, 'nothing was created by any rejected override');
  const decoyListing = await listFiles(projectDir);
  assert.ok(decoyListing.includes('private/profile.json') && decoyListing.includes(`${GENERATED_DIR}/customer-records-data.mjs`), 'decoys were present, so rejection came from the allowlist');
});

test('a narrowed override drawn from the approved constants still stages, with the projection set fixed', async t => {
  const { projectDir, repoDir, outDir } = await fakeRoots(t);
  const dependencies = SOURCE_DEPENDENCIES.filter(entry => entry !== 'src/scripts/live-metrics.ts');
  const result = await stageProblemFixture({ projectDir, repoDir, outDir, dependencies, fontAssets: FONT_ASSETS.slice(0, 2), projections: [...PROJECTION_MODULES].reverse() });
  assert.equal(result.counts.sourceDependencies, SOURCE_DEPENDENCIES.length - 1);
  assert.equal(result.counts.fontAssets, 2);
  assert.equal(result.counts.projections, 4);
  const staged = await listFiles(outDir);
  assert.ok(!staged.includes('src/scripts/live-metrics.ts'));
  assert.deepEqual((await readdir(join(outDir, 'src', 'generated'))).sort(), [...PROJECTION_MODULES, TESTIMONIALS_MODULE].sort());
});

test('command line accepts exactly one --out and nothing else', () => {
  assert.deepEqual(parseArgs(['--out', 'C:/tmp/staged']), { outDir: 'C:/tmp/staged' });
  assert.deepEqual(parseArgs(['--out=../staged']), { outDir: '../staged' });
  assert.throws(() => parseArgs([]), /--out is required/);
  assert.throws(() => parseArgs(['--out']), /needs a directory path/);
  assert.throws(() => parseArgs(['--out', '--force']), /needs a directory path/);
  assert.throws(() => parseArgs(['--out=']), /needs a directory path/);
  assert.throws(() => parseArgs(['--out', 'a', '--out', 'b']), /more than once/);
  assert.throws(() => parseArgs(['--out', 'a', '--clean']), /Unknown argument "--clean"/);
  assert.throws(() => parseArgs(['a']), /Unknown argument "a"/);
});
