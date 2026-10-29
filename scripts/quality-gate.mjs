#!/usr/bin/env node
// Runs the "Static site quality" checks locally, step for step, so a deploy
// from a Mac is gated exactly as GitHub Actions gated it. Keep the step lists
// in sync with .github/workflows/static-site-quality.yml.
//
// Usage: node scripts/quality-gate.mjs [--root <checkout>] [--quick]
//   --root   checkout to test (default: this repository); dependencies must be installed
//   --quick  unit/contract tests and the build only; skips the ~20 minute browser suite
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const rootAt = args.indexOf('--root');
const root = resolve(rootAt >= 0 ? args[rootAt + 1] : resolve(import.meta.dirname, '..'));
const quick = args.includes('--quick');
const slice = resolve(root, 'prototypes', 'html-first-slice');
const env = { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', PUBLIC_CONTACT_SUBMISSION_MODE: 'disabled' };

function run(cwd, command, extraEnv = {}) {
  console.log(`\n$ ${command}`);
  const result = spawnSync(command, { cwd, shell: '/bin/bash', stdio: 'inherit', env: { ...env, ...extraEnv } });
  if (result.status !== 0) {
    console.error(`Quality gate failed at: ${command}`);
    process.exit(1);
  }
}

if (spawnSync('php', ['-v'], { stdio: 'ignore' }).status !== 0) {
  console.error('php is required for the server handler tests (macOS: brew install php).');
  process.exit(1);
}

// Unit and output contracts
for (const command of [
  'npm test',
  'node --test ../../scripts/deploy-20i.test.mjs',
  'npm run test:consent',
  'npm run test:pricing',
  'npm run test:homepage-enhance',
  'npm run test:contact',
  'npm run test:guides-enhance',
  'npm run test:problems',
  'npm run test:standalone',
  'php -n server/tests/website-proof-test.php',
  'php -n server/tests/google-rating-test.php',
  'php -n server/tests/send-email-test.php',
  'npm run build',
]) run(slice, command);

if (quick) {
  console.log('\nQuality gate passed (quick: browser suite skipped).');
  process.exit(0);
}

// Sandboxed browser: the Chromium build that matches the locked Playwright version.
// A Chromium already named in the environment is used as is.
const requireFromRoot = createRequire(resolve(root, 'package.json'));
if (!process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) run(root, 'npx --no-install playwright install chromium');
const browserEnv = {
  PLAYWRIGHT_MODULE: process.env.PLAYWRIGHT_MODULE || requireFromRoot.resolve('playwright'),
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || requireFromRoot('playwright').chromium.executablePath(),
};

// All routes and interactive regressions
for (const command of [
  'npm run verify:blog-browser',
  'npm run verify:service-locations-browser',
  'npm run verify:technology-browser',
  'npm run verify:guides-browser',
  'npm run verify:team-browser',
  'npm run verify:standalone-browser',
  'npm run verify:industries-browser',
  'npm run verify:locations-browser',
  'node scripts/quality-browser-check.mjs',
  'npm run verify:homepage-browser',
  'PROOF_DIST=dist npm run verify:proof-browser',
  'npm run verify:browser',
  'npm run verify:pricing-browser',
  'npm run verify:case-studies-browser',
  'npm run verify:consent-ui',
  'npm run verify:fonts',
]) run(slice, command, browserEnv);

// Isolated contact failure and success journey
rmSync(resolve(slice, '.artifacts', 'contact-ci'), { recursive: true, force: true });
run(slice, 'PUBLIC_CONTACT_SUBMISSION_MODE=test node node_modules/astro/bin/astro.mjs build --outDir .artifacts/contact-ci', browserEnv);
run(slice, 'CONTACT_TEST_DIST=.artifacts/contact-ci npm run verify:contact-browser', browserEnv);

// Isolated synthetic Problem and comparison fixture build and browser journeys
rmSync(resolve(root, '.artifacts', 'problem-ci'), { recursive: true, force: true });
for (const command of [
  'mkdir -p ../../.artifacts',
  'node scripts/stage-problem-fixture.mjs --out ../../.artifacts/problem-ci',
  'npm ci --ignore-scripts --prefix ../../.artifacts/problem-ci',
  'npm run build:fixture --prefix ../../.artifacts/problem-ci',
  'PROBLEM_TEST_DIST=../../.artifacts/problem-ci/dist-synthetic npm run verify:problems-browser',
  'COMPARISON_TEST_DIST=../../.artifacts/problem-ci/dist-synthetic npm run verify:comparisons-browser',
]) run(slice, command, browserEnv);

console.log('\nQuality gate passed (full).');
