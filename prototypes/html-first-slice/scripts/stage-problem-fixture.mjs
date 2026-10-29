import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FIXTURE_BUILD_SCRIPT, FIXTURE_OUTPUT_DIR, MANIFEST_NAME, stageProblemFixture } from './lib/problem-fixture-stage.mjs';

// Stages a synthetic Problem fixture build project into a NEW directory:
//   node scripts/stage-problem-fixture.mjs --out <new-directory>
// The staged project holds the unchanged production root-slug dispatcher and
// its exact transitive dependencies, the four public-only generated
// projections, a freshly rendered synthetic testimonials module with fourteen
// synthetic logos, and a package.json whose only script is the fixture build.
// See scripts/lib/problem-fixture-stage.mjs for the allowlists. Output is
// counts and the manifest hash only; no staged content is printed.

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(projectDir, '..', '..');
const USAGE = 'Usage: node scripts/stage-problem-fixture.mjs --out <new-directory>';

export function parseArgs(argv) {
  let outDir;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    let value;
    if (arg === '--out') {
      value = argv[index + 1];
      index += 1;
    } else if (arg.startsWith('--out=')) {
      value = arg.slice('--out='.length);
    } else {
      throw new Error(`Unknown argument ${JSON.stringify(arg)}. ${USAGE}`);
    }
    if (value === undefined || value === '' || value.startsWith('--')) throw new Error(`--out needs a directory path. ${USAGE}`);
    if (outDir !== undefined) throw new Error(`--out was given more than once. ${USAGE}`);
    outDir = value;
  }
  if (outDir === undefined) throw new Error(`--out is required. ${USAGE}`);
  return { outDir };
}

async function main() {
  const { outDir } = parseArgs(process.argv.slice(2));
  const result = await stageProblemFixture({ projectDir, repoDir, outDir });
  const { counts } = result;
  console.log(`Staged synthetic Problem fixture project: ${result.outDir}`);
  console.log(`Files staged: ${counts.files} (${counts.sourceDependencies} source dependencies, ${counts.fontAssets} fonts, ${counts.fontLicences} licences, ${counts.projections} public projections, ${counts.syntheticLogos} synthetic logos, 1 synthetic testimonials module with ${counts.testimonials} reviews over ${counts.testimonialCategories} tabs, package.json, .gitignore)`);
  console.log(`${MANIFEST_NAME} SHA256: ${result.manifestSha256}`);
  console.log('Next:');
  console.log(`  cd "${result.outDir}"`);
  console.log('  npm ci');
  console.log(`  npm run ${FIXTURE_BUILD_SCRIPT}`);
  console.log(`Built pages land in ${FIXTURE_OUTPUT_DIR}/ inside the staged directory.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
