#!/usr/bin/env node
// Upload a packaged production update to the 20i package over SFTP, then prove it.
//
// Usage (driven by scripts/deploy-20i-local.mjs on the deploying Mac):
//   node scripts/deploy-20i.mjs backup  --site <dir> --manifest <file> --out <rollback-dir>
//   node scripts/deploy-20i.mjs upload  --site <dir> --manifest <file>
//   node scripts/deploy-20i.mjs record  --manifest <file> --commit <sha>
//   node scripts/deploy-20i.mjs verify  --site <dir> --manifest <file> --backup <rollback-dir> --tag <cache-buster>
//   node scripts/deploy-20i.mjs restore --out <rollback-dir>   (re-uploads the backup)
//
// Manual-change guard: `record` leaves the SHA-256 of every file it wrote in
// DEPLOY_STATE_PATH (in the SFTP home, outside public_html). `backup` compares
// the live files it downloads with that record and exits 4, uploading nothing,
// when a live file matches neither the last automatic deploy nor the new
// package: someone changed the live site by hand and this deploy would revert
// it. With no record yet (the first deploy) every differing file counts. Set
// DEPLOY_ALLOW_OVERWRITE=true (npm run deploy:20i -- --allow-overwrite) to overwrite anyway.
//
// Follows the site owner's update runbook: files are
// written over the existing public_html and NOTHING is ever deleted, so the
// live email handler, private configuration and logs stay as they are. Assets
// go first, then pages, then server handlers, then .htaccess, so no page ever
// references an asset that is not there yet. `backup` copies every file about
// to be replaced first; uploading that copy is the rollback.
//
// Connection: DEPLOY_HOST, DEPLOY_PORT, DEPLOY_USER, DEPLOY_ROOT (remote
// public_html path), DEPLOY_KEY_FILE and DEPLOY_KNOWN_HOSTS_FILE. Host keys are
// pinned (StrictHostKeyChecking=yes); there is no password path.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://fresh-tech.uk';
const NEVER_UPLOAD = new Set(['server/api/send-email.php']);
const SAFE_PATH = /^(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._@+-]+(?:\/[A-Za-z0-9._@+-]+)*$/;
// Relative to the SFTP login directory, which holds public_html; never served.
const DEPLOY_STATE_PATH = '.freshtech-deploy/last-deploy.json';
// Kept beside the backup (excluded from it) so a restore can put the record back.
const PREVIOUS_STATE = 'previous-deploy-state.json';
const ROLLBACK_LIST = 'rollback-files.json';
const sha256 = body => createHash('sha256').update(body).digest('hex');

const [command, ...rest] = process.argv.slice(2);
const option = name => { const at = rest.indexOf(`--${name}`); return at >= 0 ? rest[at + 1] : undefined; };

export function uploadOrder(paths) {
  const rank = path => path === '.htaccess' ? 3 : path.startsWith('server/') ? 2 : path.endsWith('.html') ? 1 : 0;
  return [...paths].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export function checkedPaths(manifest) {
  if (manifest?.schemaVersion !== 1 || manifest.mode !== 'production' || !Array.isArray(manifest.files)) throw new Error('Not a production update manifest');
  const preserved = new Set(manifest.preservedFiles ?? []);
  if (!preserved.has('server/api/send-email.php')) throw new Error('Package must preserve the live email handler (--preserve-existing-endpoints)');
  return manifest.files.map(({ path }) => {
    if (typeof path !== 'string' || !SAFE_PATH.test(path)) throw new Error(`Unsafe path in manifest: ${JSON.stringify(path)}`);
    if (NEVER_UPLOAD.has(path) || preserved.has(path) || path.startsWith('private/')) throw new Error(`Refusing to upload preserved path ${path}`);
    return path;
  });
}

// The URL a browser uses for a packaged file; null for files not served as-is.
export function publicUrl(path) {
  if (path === '.htaccess' || path.startsWith('server/')) return null;
  if (path === 'index.html') return '/';
  if (path.endsWith('/index.html')) return `/${path.slice(0, -'/index.html'.length)}`;
  if (path.endsWith('.html')) return null;
  return `/${path}`;
}

// Live files (path -> sha256) that match neither the last recorded automatic
// deploy nor the package about to replace them: changes made outside this
// deploy that the upload would silently revert. state is null before the
// first recorded deploy.
export function findDrift(live, state, manifest) {
  const next = new Map(manifest.files.map(file => [file.path, file.sha256]));
  const recorded = state?.files ?? {};
  return Object.entries(live)
    .filter(([path, sha]) => sha !== next.get(path) && sha !== recorded[path])
    .map(([path]) => path)
    .sort();
}

const env = name => { const value = process.env[name]; if (!value) throw new Error(`${name} is not set`); return value; };

function sftp(batchLines) {
  const root = env('DEPLOY_ROOT').replace(/\/+$/, '');
  if (root && !SAFE_PATH.test(root.replace(/^\/+/, ''))) throw new Error('DEPLOY_ROOT is not a plain path');
  // The deploy record lives in the login directory and must stay outside the web root.
  if (root === '' || root === '.') throw new Error('DEPLOY_ROOT must name public_html, not the login directory');
  const batch = batchLines.map(line => line.replaceAll('{root}', root)).join('\n') + '\n';
  const result = spawnSync('sftp', [
    '-b', '-', '-P', env('DEPLOY_PORT'), '-i', env('DEPLOY_KEY_FILE'),
    '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', `UserKnownHostsFile=${env('DEPLOY_KNOWN_HOSTS_FILE')}`,
    '-o', 'ConnectTimeout=20', `${env('DEPLOY_USER')}@${env('DEPLOY_HOST')}`,
  ], { input: batch, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`sftp failed (${result.status}): ${(result.stderr || '').slice(-2000)}`);
  return result.stdout;
}

const parents = paths => [...new Set(paths.flatMap(path => {
  const parts = path.split('/').slice(0, -1);
  return parts.map((_, index) => parts.slice(0, index + 1).join('/'));
}))].sort((a, b) => a.split('/').length - b.split('/').length);

const localPath = (dir, path) => join(dir, ...path.split('/')).split(sep).join('/');

async function backup(paths, out, manifest) {
  await mkdir(out, { recursive: true });
  for (const dir of parents(paths)) await mkdir(join(out, ...dir.split('/')), { recursive: true });
  // "-get" ignores files that do not exist yet: only replaced files are copied.
  sftp([
    ...paths.map(path => `-get "{root}/${path}" "${localPath(out, path)}"`),
    `-get "${DEPLOY_STATE_PATH}" "${localPath(out, PREVIOUS_STATE)}"`,
  ]);
  const saved = [];
  const walk = async dir => { for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const path = relative(out, full).split(sep).join('/');
    if (entry.isDirectory()) await walk(full); else if (path !== PREVIOUS_STATE) saved.push(path);
  } };
  await walk(out);
  await writeFile(join(out, ROLLBACK_LIST), `${JSON.stringify(saved.sort(), null, 2)}\n`);
  console.log(JSON.stringify({ backedUp: saved.length, of: paths.length }));

  const statePath = join(out, PREVIOUS_STATE);
  const state = existsSync(statePath) ? JSON.parse(await readFile(statePath, 'utf8')) : null;
  const live = Object.fromEntries(await Promise.all(saved.map(async path => [path, sha256(await readFile(join(out, ...path.split('/'))))])));
  const drift = findDrift(live, state, manifest);
  if (!drift.length) return;
  const reason = state
    ? `${drift.length} live file(s) changed since the last automatic deploy (${state.commit}), probably by a manual upload`
    : `there is no record of an earlier automatic deploy, and ${drift.length} live file(s) differ from this package`;
  const list = drift.slice(0, 100).map(path => `- ${path}`).join('\n') + (drift.length > 100 ? `\n- ...and ${drift.length - 100} more` : '');
  const message = `Deploying would overwrite work that is not on main: ${reason}.`;
  if (process.env.DEPLOY_ALLOW_OVERWRITE === 'true') {
    console.log(`${message} Overwriting because --allow-overwrite was given.\n${list}`);
    return;
  }
  console.log(`${message} Nothing was uploaded. Commit those changes to main, or, if they should be replaced, run: npm run deploy:20i -- --allow-overwrite\n${list}`);
  process.exit(4);
}

// Records what this deploy wrote so the next run can tell its own files from manual changes.
async function record(manifest, commit, paths) {
  if (!/^[0-9a-f]{40}$/.test(commit ?? '')) throw new Error('--commit must be a full commit SHA');
  const shas = new Map(manifest.files.map(file => [file.path, file.sha256]));
  const state = { commit, deployedAt: new Date().toISOString(), files: Object.fromEntries(paths.map(path => [path, shas.get(path)])) };
  const file = join(process.env.RUNNER_TEMP || '.', 'last-deploy.json');
  await writeFile(file, `${JSON.stringify(state, null, 2)}\n`);
  sftp([`-mkdir "${DEPLOY_STATE_PATH.split('/')[0]}"`, `put "${file.split(sep).join('/')}" "${DEPLOY_STATE_PATH}"`]);
  console.log(JSON.stringify({ recorded: paths.length, commit }));
}

function upload(paths, site) {
  for (const path of paths) if (!existsSync(join(site, ...path.split('/')))) throw new Error(`Missing packaged file ${path}`);
  const ordered = uploadOrder(paths);
  sftp([
    ...parents(ordered).map(dir => `-mkdir "{root}/${dir}"`),
    ...ordered.map(path => `put "${join(site, ...path.split('/')).split(sep).join('/')}" "{root}/${path}"`),
  ]);
  console.log(JSON.stringify({ uploaded: ordered.length }));
}

// 20i's edge answers bursts with 403 "Access denied" (seen 9 Oct 2026 at 8
// parallel requests) and 429 (18 Oct 2026: 254 of 301 requests at about 8 a
// second), and the block then covers the whole IP address for a while. So
// verification checks only the home page and the files this deploy changed,
// at most VERIFY_LIMIT of them, one a second. A blocked answer makes the run
// INCONCLUSIVE (exit 3) rather than a mismatch: it must never trigger the
// automatic restore of a deploy that may be perfectly good.
const VERIFY_WORKERS = 1;
const VERIFY_PAUSE_MS = 1000;
const VERIFY_LIMIT = 40;
const BLOCKED = new Set([403, 429, 503]);

// The served files to fetch: the home page, then the files whose content this
// deploy changed (backupShas: path -> sha256 of the replaced live file; a path
// missing from it is new), spread evenly when there are more than the limit.
export function verifySelection(files, backupShas, limit = VERIFY_LIMIT) {
  const served = files.filter(file => publicUrl(file.path));
  const home = served.filter(file => file.path === 'index.html');
  const changed = served.filter(file => file.path !== 'index.html' && backupShas[file.path] !== file.sha256);
  const room = Math.max(0, limit - home.length);
  const step = changed.length / room;
  const picked = changed.length <= room ? changed : Array.from({ length: room }, (_, index) => changed[Math.floor(index * step)]);
  return [...home, ...picked];
}

async function verify(manifest, tag, backupDir) {
  const failures = [];
  let blocked = 0;
  const backupShas = {};
  for (const path of JSON.parse(await readFile(join(backupDir, ROLLBACK_LIST), 'utf8'))) {
    backupShas[path] = sha256(await readFile(join(backupDir, ...path.split('/'))));
  }
  const files = verifySelection(manifest.files, backupShas);
  let index = 0;
  const worker = async () => {
    while (index < files.length) {
      const file = files[index++];
      const url = `${SITE_ORIGIN}${publicUrl(file.path)}?deploy=${encodeURIComponent(tag)}`;
      try {
        const response = await fetch(url, { redirect: 'manual', headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'freshtech-website-deploy-verify' } });
        const body = Buffer.from(await response.arrayBuffer());
        const sha = createHash('sha256').update(body).digest('hex');
        if (BLOCKED.has(response.status)) blocked++;
        else if (response.status !== 200 || sha !== file.sha256) failures.push(`${file.path}: ${response.status} ${sha === file.sha256 ? '' : 'content differs'}`);
      } catch { blocked++; } // a network error says nothing about the deploy
      await new Promise(done => setTimeout(done, VERIFY_PAUSE_MS));
    }
  };
  await Promise.all(Array.from({ length: VERIFY_WORKERS }, worker));
  for (const path of ['/api/website-metrics', '/api/website-feedback', '/api/google-rating']) {
    const response = await fetch(`${SITE_ORIGIN}${path}`).catch(() => null);
    const type = response?.headers.get('content-type') ?? '';
    if (!response || BLOCKED.has(response.status)) blocked++;
    else if (response.status !== 200 || !type.startsWith('application/json')) failures.push(`${path}: ${response.status} ${type}`);
    await new Promise(done => setTimeout(done, VERIFY_PAUSE_MS));
  }
  console.log(JSON.stringify({ verified: files.length + 3, failures: failures.length, refused: blocked }));
  // A definite mismatch outranks refused requests; only refusals alone are inconclusive.
  if (failures.length) throw new Error(`Live verification failed:\n${failures.slice(0, 50).join('\n')}`);
  if (blocked) {
    console.error(`Verification inconclusive: ${blocked} request(s) were refused (rate limit) or failed to connect. Nothing restored.`);
    process.exit(3);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (command === 'restore') {
    const out = resolve(option('out') ?? '');
    const saved = JSON.parse(await readFile(join(out, ROLLBACK_LIST), 'utf8'));
    for (const path of saved) if (!SAFE_PATH.test(path) || NEVER_UPLOAD.has(path) || path === PREVIOUS_STATE) throw new Error(`Unsafe rollback path ${path}`);
    upload(saved, out);
    // The live files are the previous ones again, so the record must be too.
    const previous = join(out, PREVIOUS_STATE);
    sftp(existsSync(previous) ? [`put "${previous.split(sep).join('/')}" "${DEPLOY_STATE_PATH}"`] : [`-rm "${DEPLOY_STATE_PATH}"`]);
    process.exit(0);
  }
  if (!['backup', 'upload', 'record', 'verify'].includes(command)) {
    console.error('Usage: deploy-20i.mjs backup|upload|record|verify|restore --site <dir> --manifest <file> [--out <dir>] [--tag <tag>] [--commit <sha>]');
    process.exit(2);
  }
  const manifest = JSON.parse(await readFile(resolve(option('manifest') ?? ''), 'utf8'));
  const paths = checkedPaths(manifest);
  const site = resolve(option('site') ?? '');
  if (command === 'backup') await backup(paths, resolve(option('out') ?? ''), manifest);
  else if (command === 'upload') upload(paths, site);
  else if (command === 'record') await record(manifest, option('commit'), paths);
  else await verify(manifest, option('tag') ?? String(Date.now()), resolve(option('backup') ?? ''));
}
