/**
 * Google Indexing API notifications for eligible pages only.
 * Google supports JobPosting or BroadcastEvent within VideoObject, not ordinary
 * marketing pages or articles. An accepted notification does not prove indexing.
 * https://developers.google.com/search/apis/indexing-api/v3/quickstart
 *
 * After verifying eligible markup, supply explicit URLs and the matching type:
 * node scripts/gsc-submit.mjs --eligible-type=JobPosting --dry-run https://fresh-tech.uk/jobs/example
 * Removal of a formerly eligible page also supports --action=URL_DELETED.
 * Ordinary site discovery uses sitemap.xml; this script never submits a sitemap.
 * Auth: GSC_SA_KEY or GSC_KEY_FILE, read only for actual eligible submissions.
 */
import fs from 'fs';
import crypto from 'crypto';
const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:fresh-tech.uk';
const SCOPE = 'https://www.googleapis.com/auth/indexing';
const DAILY_CAP = 200;

const args = process.argv.slice(2);
const action = (args.find(a => a.startsWith('--action=')) || '--action=URL_UPDATED').split('=')[1];
const explicitUrls = args.filter(a => a.startsWith('http'));
const eligibleType = args.find(a => a.startsWith('--eligible-type='))?.split('=')[1];
const dryRun = args.includes('--dry-run');

// Fail before credentials, network access or notifications. This is an explicit
// operator declaration of verified eligibility, not an automatic schema check.
if (!['JobPosting', 'BroadcastEvent'].includes(eligibleType) || explicitUrls.length === 0
  || args.some(a => a === '--new-vs-live' || a.startsWith('--changed-since='))) {
  console.error('Google Indexing API only supports verified JobPosting or BroadcastEvent pages. Supply explicit URLs and --eligible-type=JobPosting or --eligible-type=BroadcastEvent. Use the sitemap for ordinary pages.');
  process.exit(1);
}
if (!['URL_UPDATED', 'URL_DELETED'].includes(action)
  || explicitUrls.some(value => {
    try { const url = new URL(value); return url.origin !== 'https://fresh-tech.uk' || Boolean(url.username || url.password); }
    catch { return true; }
  })) {
  console.error('Use URL_UPDATED or URL_DELETED and explicit https://fresh-tech.uk URLs.');
  process.exit(1);
}

function loadKey() {
  if (process.env.GSC_SA_KEY) return JSON.parse(process.env.GSC_SA_KEY);
  const file = process.env.GSC_KEY_FILE || `${process.env.HOME || process.env.USERPROFILE}/.gsc/service_account.json`;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function getToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: key.client_email, scope: SCOPE, aud: key.token_uri, exp: now + 3600, iat: now,
  }));
  const input = `${header}.${claim}`;
  const sig = b64url(crypto.sign('RSA-SHA256', Buffer.from(input), key.private_key));
  const res = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${input}.${sig}`,
    }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error('Auth failed: ' + JSON.stringify(json));
  return json.access_token;
}

async function submit(token, url) {
  const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, type: action }),
  });
  if (res.status === 429) return { url, quota: true };
  const json = await res.json();
  return json.error ? { url, error: json.error.message } : { url, ok: true };
}

const targets = [...new Set(explicitUrls)];
const capped = targets.slice(0, DAILY_CAP);
const overflow = targets.length - capped.length;

if (dryRun) {
  console.log(`[dry-run] ${SITE_URL} | action: ${action} | would submit ${capped.length}${overflow > 0 ? ` (capped, ${overflow} over limit)` : ''}:`);
  capped.forEach(u => console.log(`  ${u}`));
} else if (capped.length === 0) {
  console.log('Nothing new to submit.');
} else {
  console.log(`Site: ${SITE_URL} | action: ${action} | submitting ${capped.length}${overflow > 0 ? ` (capped, ${overflow} over daily limit)` : ''}`);
  const token = await getToken(loadKey());
  let ok = 0, quota = 0; const errors = [];
  const CONC = 4;
  for (let i = 0; i < capped.length; i += CONC) {
    const res = await Promise.all(capped.slice(i, i + CONC).map(u => submit(token, u)));
    for (const r of res) {
      if (r.ok) ok++;
      else if (r.quota) quota++;
      else errors.push(`${r.url}: ${r.error}`);
    }
    process.stdout.write(`  ${Math.min(i + CONC, capped.length)}/${capped.length}\r`);
  }
  console.log(`\nDone: ${ok} submitted, ${quota} quota-blocked, ${errors.length} errors.`);
  if (errors.length) console.log('Errors:\n  ' + errors.slice(0, 10).join('\n  '));
  if (overflow > 0) console.log(`${overflow} URL(s) over today's quota, re-run tomorrow to continue.`);
}
