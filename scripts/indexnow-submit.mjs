/**
 * Submit URLs to IndexNow (notifies Bing, Yandex, Seznam, Naver in one call).
 * Free, no auth: the key is verified by a public key file at the domain root.
 *
 * Usage:
 *   node scripts/indexnow-submit.mjs                # submit all sitemap URLs
 *   node scripts/indexnow-submit.mjs --new-vs-live  # only URLs new since the live sitemap
 *   node scripts/indexnow-submit.mjs --dry-run      # show what would be sent
 *
 * Note: Google does NOT use IndexNow (use scripts/gsc-submit.mjs for Google).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST = 'fresh-tech.uk';
const KEY = '2b725a5296b158e1900494bc69ec6024';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const args = process.argv.slice(2);
const newVsLive = args.includes('--new-vs-live');
const dryRun = args.includes('--dry-run');

function localUrls() {
  const xml = fs.readFileSync(path.join(__dirname, '../public/sitemap.xml'), 'utf-8');
  return (xml.match(/<loc>([^<]+)<\/loc>/g) || []).map(m => m.replace(/<\/?loc>/g, ''));
}
async function liveUrls() {
  try {
    const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
    return new Set((xml.match(/<loc>([^<]+)<\/loc>/g) || []).map(m => m.replace(/<\/?loc>/g, '')));
  } catch { return new Set(); }
}

let urls = localUrls();
if (newVsLive) {
  const live = await liveUrls();
  urls = urls.filter(u => !live.has(u));
  console.log(`new-vs-live: ${urls.length} new URL(s) since the live sitemap.`);
}

if (urls.length === 0) {
  console.log('IndexNow: nothing to submit.');
} else if (dryRun) {
  console.log(`[dry-run] IndexNow would submit ${urls.length} URL(s) to Bing/Yandex/etc:`);
  urls.forEach(u => console.log(`  ${u}`));
} else {
  // IndexNow accepts up to 10,000 URLs per request.
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
  });
  console.log(`IndexNow: submitted ${urls.length} URL(s) -> HTTP ${res.status} ${res.statusText}`);
  if (res.status !== 200 && res.status !== 202) {
    console.log('  (200/202 = accepted. 422 usually means the key file is not live yet; it resolves on the next deploy.)');
  }
}
