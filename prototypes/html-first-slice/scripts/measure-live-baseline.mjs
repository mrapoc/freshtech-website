import { createRequire } from 'node:module';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');

const projectDir = resolve(import.meta.dirname, '..');
const targetUrl = 'https://fresh-tech.uk/services/managed-it-support';
const browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const scriptResponses = new Map();
  const vendorRequests = [];
  const reads = [];

  page.on('request', request => {
    if (/google-analytics|googletagmanager|clarity\.ms|calendly\.com/.test(request.url())) vendorRequests.push(request.url());
  });
  page.on('response', response => {
    if (response.request().resourceType() !== 'script' || scriptResponses.has(response.url())) return;
    scriptResponses.set(response.url(), null);
    reads.push(response.body().then(body => scriptResponses.set(response.url(), body)));
  });

  const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60_000 });
  if (!response?.ok()) throw new Error(`Live route returned ${response?.status() ?? 'no response'}`);
  await page.waitForTimeout(1_000);
  await Promise.all(reads);

  const inlineScripts = await page.evaluate(() => [...document.scripts]
    .filter(script => !script.src && !/^(application|text)\/ld\+json$/i.test(script.type))
    .map(script => script.textContent || '')
    .filter(Boolean));
  const inlineBody = Buffer.from(inlineScripts.join('\n'), 'utf8');
  const assets = [...scriptResponses]
    .filter(([, body]) => body)
    .map(([url, body]) => ({
      url,
      bytes: body.length,
      gzipBytes: gzipSync(body).length,
      brotliBytes: brotliCompressSync(body).length,
    }));
  const sum = key => assets.reduce((total, asset) => total + asset[key], 0);
  const inline = {
    count: inlineScripts.length,
    bytes: inlineBody.length,
    gzipBytes: inlineBody.length ? gzipSync(inlineBody).length : 0,
    brotliBytes: inlineBody.length ? brotliCompressSync(inlineBody).length : 0,
  };
  const liveTotals = {
    bytes: sum('bytes') + inline.bytes,
    gzipBytes: sum('gzipBytes') + inline.gzipBytes,
    brotliBytes: sum('brotliBytes') + inline.brotliBytes,
  };
  const prototypeEvidence = JSON.parse(await readFile(resolve(projectDir, 'evidence', 'prototype-first-load.json'), 'utf8'));
  const prototypeTotals = prototypeEvidence.totals;
  const reductionPercent = liveTotals.gzipBytes
    ? Number(((1 - prototypeTotals.gzipBytes / liveTotals.gzipBytes) * 100).toFixed(1))
    : null;

  const evidence = {
    measuredAt: new Date().toISOString(),
    route: targetUrl,
    finalUrl: page.url(),
    status: response.status(),
    method: 'Cold browser context, network idle plus 1 second; unique script response bodies and executable inline scripts; JSON-LD excluded.',
    limitation: 'The live deployment is a point-in-time baseline and may not match the local source revision exactly.',
    vendorRequestsBeforeConsent: vendorRequests,
    externalScripts: assets,
    inlineScripts: inline,
    liveTotals,
    prototypeTotals,
    firstLoadGzipReductionPercent: reductionPercent,
  };
  await writeFile(resolve(projectDir, 'evidence', 'react-live-baseline.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  if (vendorRequests.length) throw new Error('Live production loaded consent-gated vendor scripts before consent');
  if (reductionPercent === null) throw new Error('No live JavaScript was measured');
  console.log(`Live React first-load JS: ${liveTotals.gzipBytes} gzip bytes; prototype: ${prototypeTotals.gzipBytes}; reduction: ${reductionPercent}%`);
} finally {
  await browser.close();
}
