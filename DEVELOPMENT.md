# Local development and verification

Read AGENTS.md. The site is the Astro application under `prototypes/html-first-slice/`.
Node 24 (`.nvmrc`; the Astro project needs 22.12 or newer) and PHP are required.

## Setup

From the repository root:

```
npm ci
npm ci --prefix prototypes/html-first-slice
```

The root install provides Playwright for the browser checks and the Cloudinary upload
helper; `npm test` at the root runs the `.htaccess` generator and deploy unit tests.
New worktrees need dependency installation and explicit local service configuration.

## Full quality gate

`node scripts/quality-gate.mjs` (or `npm run quality-gate`) runs every check below in
order: unit and output contracts, the full build, the browser suite and the isolated
contact and synthetic fixture journeys. It takes about 25 minutes; `--quick` stops after
the build. The Mac deploy runs it before every release, and the manual `Static site
quality` workflow runs the same steps on GitHub. Keep the two step lists in sync.

## Astro checks

Run from `prototypes/html-first-slice` with `ASTRO_TELEMETRY_DISABLED=1` set (`export ASTRO_TELEMETRY_DISABLED=1`
on macOS/Linux, `$env:ASTRO_TELEMETRY_DISABLED = '1'` in PowerShell):

```
npm ci
npm test
npm run test:consent
npm run test:pricing
npm run test:homepage-enhance
npm run test:contact
npm run test:guides-enhance
npm run test:problems
php -n server/tests/website-proof-test.php
php -n server/tests/google-rating-test.php
npm run test:proof
npm run build
```

The native build must validate every emitted HTML route using the shared
quality contract as well as family-specific content/metadata checks. See
[the static quality contract](docs/seo/static-quality-contract.md). New pages
must be discovered automatically, and a violation must fail the build.

For browser checks, use the verified Playwright module and an explicit full
Chromium/Edge executable. Every launch must keep `chromiumSandbox: true`.
The root lockfile provides Playwright; the gate resolves its module and Chromium
build automatically, or uses `PLAYWRIGHT_MODULE` and
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` when set. Worker paths come from its private
profile. Do not copy that profile, credentials or customer source records.

```
node scripts/quality-browser-check.mjs
npm run verify:homepage-browser
npm run verify:browser
npm run verify:pricing-browser
npm run verify:proof-browser
npm run verify:case-studies-browser
npm run verify:locations-browser
npm run verify:industries-browser
npm run verify:blog-browser
npm run verify:service-locations-browser
npm run verify:technology-browser
npm run verify:guides-browser
npm run verify:consent-ui
npm run verify:fonts
```

The route sweep covers all built pages. Focused checks retain meaningful
interactions and font/layout regressions that a generic sweep cannot prove.
Provider requests are mocked, and the normal contact output remains disabled.
Problem-family browser checks require a separately staged synthetic output via
`scripts/stage-problem-fixture.mjs` and `PROBLEM_TEST_DIST`; then run
`npm run verify:problems-browser`. Never use canonical customer records in the
worker packet. The default build rejects fixture mode and compares canonical
testimonial values locally.
Do not package a form-test build. A passing gate is build and browser evidence,
not proof of a production rollout or a Google score.

`verify:proof-browser` reads `dist-production` by default; set `PROOF_DIST=dist`
to check preview output. It mocks only anonymous public feeds with synthetic data
and never adds fixtures to the build. The PHP tests read synthetic snapshot
files under `php -n`; they are not live Apache evidence.
For production, set `PUBLIC_SITE_MODE=production` and run `npm run build`, then
follow the public proof release checks (kept privately in `~/Context/FreshTech/Website/internal-docs/`). Updating
the existing site uses `node scripts/package-static-production.mjs
--preserve-existing-endpoints` from the repository root. Redirect or header changes go in
`hosting/routing.json`; check the generated `.htaccess` with `npm test` at the root.

## Services and runtime

Keep service-account keys outside Git and evidence. Live GSC indexing or IndexNow
submissions and real lead submissions require authorization for those actions.
Never use a submission command as a read-only validation step.

Continue the same task through related fixes/review. Record durable decisions in
project docs and include branch, current changes, checks and next step in handovers.

## Workspace standard

Follow [.workspace/STANDARD.md](.workspace/STANDARD.md). Related context and verification
contracts are indexed in [.workspace/project.json](.workspace/project.json).
