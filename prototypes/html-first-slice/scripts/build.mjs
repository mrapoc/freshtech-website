import { spawnSync } from 'node:child_process';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

import { STANDALONE_ROUTES } from './lib/standalone-routes.mjs';
import { resolveSiteMode } from '../src/lib/site-mode.mjs';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function run(script, args = []) {
  const result = spawnSync(process.execPath, [resolve(projectDir, script), ...args], {
    cwd: projectDir,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// The default release build only ever renders canonical-source testimonials.
// Any non-empty TESTIMONIALS_FIXTURE (not just "1") is rejected before a single
// extractor runs so a synthetic fixture can never reach the shared dist output.
// Fixture builds are staged separately by scripts/stage-problem-fixture.mjs.
const testimonialsFixture = process.env.TESTIMONIALS_FIXTURE;
if (testimonialsFixture !== undefined && testimonialsFixture !== '') {
  console.error('TESTIMONIALS_FIXTURE must be unset or empty for the default build; fixture builds use scripts/stage-problem-fixture.mjs.');
  process.exit(1);
}

// Unset PUBLIC_SITE_MODE is the preview build; anything unrecognised fails here.
const siteMode = resolveSiteMode(process.env.PUBLIC_SITE_MODE);

run('scripts/extract-pricing.mjs');
run('scripts/extract-services.mjs');
run('scripts/extract-case-studies.mjs');
run('scripts/extract-locations.mjs');
run('scripts/extract-industries.mjs');
run('scripts/extract-blog.mjs');
run('scripts/extract-service-locations.mjs');
run('scripts/extract-technology.mjs');
run('scripts/extract-guides.mjs');
run('scripts/extract-problems.mjs');
run('scripts/extract-comparisons.mjs');
run('scripts/extract-team.mjs');
run('scripts/extract-standalone-data.mjs');
run('scripts/extract-legal.mjs');
run('scripts/extract-testimonials.mjs');

// Production writes to its own directory so the preview dist, its family gates
// and evidence metrics are never mixed with release output.
if (siteMode === 'production') {
  const productionDist = resolve(projectDir, 'dist-production');
  run('node_modules/astro/bin/astro.mjs', ['build', '--outDir', productionDist]);
  run('scripts/production-root-files.mjs', [productionDist]);
  run('scripts/recruitment-output-check.mjs', [productionDist]);
  run('scripts/production-output-check.mjs', [productionDist]);
  run('scripts/check-emitted-html-quality.mjs', [productionDist]);
  console.log(`Production build complete: ${productionDist}`);
  process.exit(0);
}
const { services } = await import('../src/generated/services-data.mjs');
const { caseStudySlugs } = await import('../src/generated/case-studies-data.mjs');
const { locationSlugs } = await import('../src/generated/locations-data.mjs');
const { industrySlugs } = await import('../src/generated/industries-data.mjs');
const { blogSlugs } = await import('../src/generated/blog-data.mjs');
const { serviceLocationSlugs } = await import('../src/generated/service-locations-data.mjs');
const { techSlugs } = await import('../src/generated/technology-data.mjs');
const { guideSlugs } = await import('../src/generated/guides-data.mjs');
const { problemSlugs } = await import('../src/generated/problems-data.mjs');
const { comparisonSlugs } = await import('../src/generated/comparisons-data.mjs');
const { teamSlugs } = await import('../src/generated/team-data.mjs');
const started = performance.now();
run('node_modules/astro/bin/astro.mjs', ['build']);
const buildMilliseconds = Math.round((performance.now() - started) * 10) / 10;
run('scripts/verify-output.mjs');
run('scripts/verify-pricing-output.mjs');
run('scripts/contact-output-check.mjs');
run('scripts/location-output-check.mjs');
run('scripts/industry-output-check.mjs');
run('scripts/blog-output-check.mjs');
run('scripts/service-location-output-check.mjs');
run('scripts/technology-output-check.mjs');
run('scripts/guide-output-check.mjs');
run('scripts/problem-output-check.mjs');
run('scripts/comparison-output-check.mjs');
run('scripts/team-output-check.mjs');
run('scripts/recruitment-output-check.mjs');
run('scripts/standalone-output-check.mjs');
run('scripts/check-emitted-html-quality.mjs');

const dist = resolve(projectDir, 'dist');
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir)) {
    const path = join(dir, entry);
    const info = await stat(path);
    if (info.isDirectory()) await walk(path);
    else files.push(path);
  }
}
await walk(dist);

const measured = [];
for (const path of files) {
  const body = await readFile(path);
  measured.push({
    path: relative(dist, path).replaceAll('\\', '/'),
    type: extname(path).slice(1) || 'other',
    bytes: body.length,
    gzipBytes: gzipSync(body).length,
    brotliBytes: brotliCompressSync(body).length,
  });
}

const htmlBodies = await Promise.all(measured.filter(file => file.type === 'html').map(file => readFile(resolve(dist, file.path), 'utf8')));
const scriptMatches = htmlBodies.flatMap(html => [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]);
const inlineScripts = scriptMatches
  .filter(match => !/type=["']application\/ld\+json["']/i.test(match[1]) && !/\bsrc=["']/i.test(match[1]) && match[2].trim())
  .map(match => Buffer.from(match[2]));
const structuredData = scriptMatches
  .filter(match => /type=["']application\/ld\+json["']/i.test(match[1]))
  .map(match => Buffer.from(match[2]));
const totals = (type) => measured.filter(file => file.type === type).reduce((sum, file) => sum + file.bytes, 0);
const compressedTotals = (type, key) => measured.filter(file => file.type === type).reduce((sum, file) => sum + file[key], 0);
const inlineJavaScript = {
  bytes: inlineScripts.reduce((sum, script) => sum + script.length, 0),
  gzipBytes: inlineScripts.length ? gzipSync(Buffer.concat(inlineScripts)).length : 0,
  brotliBytes: inlineScripts.length ? brotliCompressSync(Buffer.concat(inlineScripts)).length : 0,
};
const structuredDataBytes = structuredData.reduce((sum, script) => sum + script.length, 0);

const metrics = {
  scope: `homepage, complete pricing page, disabled contact prototype, the /services listing, complete service template family (${services.length} generated /services/[slug] routes), the /case-studies listing and ${caseStudySlugs.length} generated /case-studies/[slug] routes, ${locationSlugs.length} generated /locations/[slug] routes, the /industries listing plus ${industrySlugs.length} industry details, the /blog listing plus ${blogSlugs.length} published articles, ${serviceLocationSlugs.length} root-slug service-location routes, the /technology listing plus ${techSlugs.length} technology explainers, ${guideSlugs.length} generated /guides/[industry] routes, ${problemSlugs.length} root-slug problem routes, ${comparisonSlugs.length} root-slug comparison routes, and ${teamSlugs.length} /team/[slug] profiles`,
  homepageRoutes: ['/'],
  serviceRoutes: ['/services', ...services.map(service => `/services/${service.page.slug}`)],
  caseStudyRoutes: ['/case-studies', ...caseStudySlugs.map(slug => `/case-studies/${slug}`)],
  locationRoutes: locationSlugs.map(slug => `/locations/${slug}`),
  industryRoutes: ['/industries', ...industrySlugs.map(slug => `/industries/${slug}`)],
  blogRoutes: ['/blog', ...blogSlugs.map(slug => `/blog/${slug}`)],
  serviceLocationRoutes: serviceLocationSlugs.map(slug => `/${slug}`),
  technologyRoutes: ['/technology', ...techSlugs.map(slug => `/technology/${slug}`)],
  guideRoutes: guideSlugs.map(slug => `/guides/${slug}`),
  guideCount: guideSlugs.length,
  problemRoutes: problemSlugs.map(slug => `/${slug}`),
  comparisonRoutes: comparisonSlugs.map(slug => `/${slug}`),
  teamRoutes: teamSlugs.map(slug => `/team/${slug}`),
  standaloneRoutes: STANDALONE_ROUTES.map(entry => entry.route),
  astroVersion: '7.3.2',
  nodeVersion: process.version,
  buildMilliseconds,
  files: measured,
  totals: {
    html: { bytes: totals('html'), gzipBytes: compressedTotals('html', 'gzipBytes'), brotliBytes: compressedTotals('html', 'brotliBytes') },
    css: { bytes: totals('css'), gzipBytes: compressedTotals('css', 'gzipBytes'), brotliBytes: compressedTotals('css', 'brotliBytes') },
    externalJavaScript: { bytes: totals('js'), gzipBytes: compressedTotals('js', 'gzipBytes'), brotliBytes: compressedTotals('js', 'brotliBytes') },
    inlineJavaScript,
    structuredDataBytes,
    fonts: { bytes: totals('woff2'), gzipBytes: compressedTotals('woff2', 'gzipBytes'), brotliBytes: compressedTotals('woff2', 'brotliBytes') },
  },
  exclusions: ['Remote logo image bytes'],
};

metrics.routes = {};
const routeFiles = measured.filter(file => file.type === 'html').map(file => {
  if (file.path !== 'index.html' && !file.path.endsWith('/index.html')) {
    throw new Error(`Unexpected HTML route layout: ${file.path}`);
  }
  return [file.path === 'index.html' ? '/' : '/' + file.path.slice(0, -11), file.path];
});
for (const [route, file] of routeFiles) {
  const routeBody = await readFile(resolve(dist, file));
  const routeHtml = routeBody.toString('utf8');
  const matches = [...routeHtml.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(match => !/type=["']application\/ld\+json["']/i.test(match[1]))
    .map(match => Buffer.from(match[2]));
  const scripts = Buffer.concat(matches);
  metrics.routes[route] = {
    html: { bytes: routeBody.length, gzipBytes: gzipSync(routeBody).length, brotliBytes: brotliCompressSync(routeBody).length },
    inlineJavaScript: {
      bytes: scripts.length,
      gzipBytes: scripts.length ? gzipSync(scripts).length : 0,
      brotliBytes: scripts.length ? brotliCompressSync(scripts).length : 0,
    },
  };
}

await mkdir(resolve(projectDir, 'evidence'), { recursive: true });
await writeFile(resolve(projectDir, 'evidence', 'build-metrics.json'), `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(metrics.totals, null, 2));
console.log(`Astro build: ${buildMilliseconds} ms`);
