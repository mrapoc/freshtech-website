#!/usr/bin/env node
// Deploys main to the live 20i site from this Mac, replacing the GitHub Actions
// deploy. Installed and scheduled by scripts/setup-20i-deploy-mac.sh; it runs
// from a "tools" worktree that the launcher keeps on the tip of origin/main.
//
// Usage (via the launcher, or `npm run deploy:20i -- <flags>` in the repo):
//   (no flags)          deploy the tip of origin/main now
//   --auto              scheduled run: quietly skip a commit already deployed or already failed
//   --commit <sha>      deploy an earlier commit on main (rollback; held until main moves on)
//   --allow-overwrite   overwrite live files changed outside this deploy (see deploy-20i.mjs)
//   --quick             skip the ~20 minute browser suite (unit/contract tests and build still run)
//
// Every run builds in its own clean worktree, never in your working copy, so
// uncommitted or unmerged local work can never go live. The quality gate is
// the same as GitHub's "Static site quality". The upload, manual-change guard,
// live verification and automatic restore are scripts/deploy-20i.mjs.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const HOME_DIR = process.env.FRESHTECH_DEPLOY_HOME || join(homedir(), 'Library', 'Application Support', 'freshtech-deploy');
const CONFIG_FILE = process.env.FRESHTECH_DEPLOY_CONFIG || join(homedir(), '.config', 'freshtech-deploy', 'config.json');
const SITE_ORIGIN = 'https://fresh-tech.uk';
const KEEP_BACKUPS = 10;

const args = process.argv.slice(2);
const flag = name => args.includes(`--${name}`);
const commitAt = args.indexOf('--commit');
const requestedCommit = commitAt >= 0 ? args[commitAt + 1] : undefined;
const auto = flag('auto');

const tools = resolve(import.meta.dirname, '..');
const build = join(HOME_DIR, 'build');
const stateFile = join(HOME_DIR, 'state.json');
const lockDir = join(HOME_DIR, 'lock');

const log = message => console.log(`[${new Date().toISOString()}] ${message}`);

function notify(message, title = 'Fresh Tech website deploy') {
  log(message);
  if (process.platform !== 'darwin') return;
  const quote = text => `"${String(text).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
  spawnSync('osascript', ['-e', `display notification ${quote(message)} with title ${quote(title)}`], { stdio: 'ignore' });
}

// Every step has a time limit, so a hung check fails the run (and notifies)
// instead of holding the lock and silently blocking every later deploy.
const MINUTES = 60_000;
function sh(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit', encoding: 'utf8', timeout: 30 * MINUTES, killSignal: 'SIGKILL', ...options,
  });
  if (result.error?.code === 'ETIMEDOUT') throw new Error(`${command} ${commandArgs.slice(0, 3).join(' ')} timed out after ${Math.round((options.timeout ?? 30 * MINUTES) / MINUTES)} minutes`);
  if (options.allowFailure) return result;
  if (result.status !== 0) throw new Error(`${command} ${commandArgs.slice(0, 3).join(' ')} failed (exit ${result.status ?? result.error?.message})`);
  return result;
}
const git = (cwd, ...gitArgs) => sh('git', ['-C', cwd, ...gitArgs], { capture: true }).stdout.trim();

const readJson = (path, fallback) => { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; } };

// One deploy at a time; a lock left by a crashed run is taken over.
function lock() {
  mkdirSync(HOME_DIR, { recursive: true });
  try { mkdirSync(lockDir); } catch {
    const pid = Number(readJson(join(lockDir, 'pid.json'), {}).pid);
    let alive = false;
    try { process.kill(pid, 0); alive = true; } catch {}
    if (alive) { log(`Another deploy (pid ${pid}) is running; nothing to do.`); process.exit(0); }
  }
  writeFileSync(join(lockDir, 'pid.json'), JSON.stringify({ pid: process.pid }));
  process.on('exit', () => rmSync(lockDir, { recursive: true, force: true }));
}

const config = readJson(CONFIG_FILE, null);
if (!config) { console.error(`No deploy configuration at ${CONFIG_FILE}. Run scripts/setup-20i-deploy-mac.sh first.`); process.exit(2); }
for (const key of ['repoDir', 'host', 'port', 'user', 'root', 'keyFile', 'knownHostsFile']) {
  if (!config[key]) { console.error(`${CONFIG_FILE} is missing "${key}". Re-run scripts/setup-20i-deploy-mac.sh.`); process.exit(2); }
}

lock();
const state = readJson(stateFile, {});
const saveState = changes => writeFileSync(stateFile, `${JSON.stringify({ ...state, ...changes }, null, 2)}\n`);

let target;
let tip;
try {
  git(config.repoDir, 'fetch', '--quiet', 'origin', 'main');
  tip = git(config.repoDir, 'rev-parse', 'origin/main');
  target = requestedCommit ? git(config.repoDir, 'rev-parse', '--verify', `${requestedCommit}^{commit}`) : tip;
  if (sh('git', ['-C', config.repoDir, 'merge-base', '--is-ancestor', target, tip], { allowFailure: true }).status !== 0) {
    throw new Error(`${target} is not on main; only reviewed, merged work is deployed.`);
  }
  // After a rollback (--commit), the schedule leaves that main tip alone until something newer is merged.
  if (auto && [state.deployed, state.failed, state.heldTip].includes(target)) {
    const reason = target === state.deployed ? 'already deployed' : target === state.failed ? 'already tried and failed' : 'held back by a rollback';
    log(`Nothing new on main (${target.slice(0, 7)} ${reason}).`);
    process.exit(0);
  }
  const subject = git(config.repoDir, 'log', '-1', '--format=%s', target);
  log(`Deploying ${target.slice(0, 7)}: ${subject}`);

  // A clean, separate checkout of exactly this commit (dependencies kept between runs).
  if (!existsSync(join(build, '.git'))) {
    rmSync(build, { recursive: true, force: true });
    sh('git', ['-C', config.repoDir, 'worktree', 'prune']);
    sh('git', ['-C', config.repoDir, 'worktree', 'add', '--detach', build, target]);
  }
  sh('git', ['-C', build, 'checkout', '--quiet', '--detach', '--force', target]);
  sh('git', ['-C', build, 'clean', '-fdxq', '-e', 'node_modules']);
  sh('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: build });
  sh('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund', '--prefix', 'prototypes/html-first-slice'], { cwd: build });

  log('Running the quality gate...');
  sh(process.execPath, [join(tools, 'scripts', 'quality-gate.mjs'), '--root', build, ...(flag('quick') ? ['--quick'] : [])], { timeout: 90 * MINUTES });

  log('Building and packaging the production site...');
  const env = { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', PUBLIC_CONTACT_SUBMISSION_MODE: 'disabled' };
  sh('npm', ['run', 'build'], { cwd: join(build, 'prototypes', 'html-first-slice'), env: { ...env, PUBLIC_SITE_MODE: 'production' } });
  const tag = `mac${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;
  sh(process.execPath, [join(build, 'scripts', 'package-static-production.mjs'), '--preserve-existing-endpoints', '--tag', tag], { cwd: build, env: { ...env, PYTHON: 'python3' } });
  const packages = join(build, '.artifacts', '20i-production');
  const site = join(packages, readdirSync(packages).find(name => name.endsWith(`-update-${tag}-site`)));
  const manifest = join(packages, readdirSync(packages).find(name => name.endsWith(`-${tag}-manifest.json`)));

  const backups = join(HOME_DIR, 'backups');
  const rollback = join(backups, tag);
  const tmp = join(HOME_DIR, 'tmp');
  mkdirSync(tmp, { recursive: true });
  const deployEnv = {
    ...process.env,
    DEPLOY_HOST: config.host, DEPLOY_PORT: String(config.port), DEPLOY_USER: config.user, DEPLOY_ROOT: config.root,
    DEPLOY_KEY_FILE: config.keyFile, DEPLOY_KNOWN_HOSTS_FILE: config.knownHostsFile,
    DEPLOY_ALLOW_OVERWRITE: flag('allow-overwrite') ? 'true' : 'false', RUNNER_TEMP: tmp,
  };
  const step = (command, extra = [], allowFailure = false) =>
    sh(process.execPath, [join(tools, 'scripts', 'deploy-20i.mjs'), command, ...extra], { env: deployEnv, allowFailure });
  const restore = () => step('restore', ['--out', rollback]);

  log('Backing up the live files about to be replaced...');
  const backedUp = step('backup', ['--site', site, '--manifest', manifest, '--out', rollback], true);
  if (backedUp.status === 4) {
    saveState({ failed: target });
    notify('Deploy stopped: the live site has changes that are not on main. Nothing was uploaded. See the deploy log.');
    process.exit(1);
  }
  if (backedUp.status !== 0) throw new Error('Backing up the live files failed; nothing was uploaded.');
  // Keep the most recent backups only.
  for (const old of readdirSync(backups).sort().slice(0, -KEEP_BACKUPS)) rmSync(join(backups, old), { recursive: true, force: true });

  log('Uploading...');
  if (step('upload', ['--site', site, '--manifest', manifest], true).status !== 0) {
    restore();
    throw new Error('The upload failed part way; the previous files were restored.');
  }
  step('record', ['--manifest', manifest, '--commit', target]);

  log('Verifying the live site byte for byte...');
  const first = step('verify', ['--site', site, '--manifest', manifest, '--backup', rollback, '--tag', tag], true).status;
  let verified = first;
  if (first !== 0) {
    await new Promise(done => setTimeout(done, 60_000));
    verified = step('verify', ['--site', site, '--manifest', manifest, '--backup', rollback, '--tag', `${tag}-retry`], true).status;
    // A mismatch the retry could neither confirm nor clear is treated as real: restoring is the safe side.
    if (first === 1 && verified === 3) verified = 1;
  }
  if (verified === 1) {
    restore();
    throw new Error('The live site did not match the build; the previous files were restored.');
  }

  // A plain GET answers 403 only while the private email configuration is readable; nothing is submitted.
  const status = async path => (await fetch(`${SITE_ORIGIN}${path}`, { redirect: 'manual' }).catch(() => ({ status: 0 }))).status;
  const email = await status('/api/send-email');
  const direct = await status('/server/api/send-email.php');
  saveState({ deployed: target, failed: null, heldTip: requestedCommit && target !== tip ? tip : null, deployedAt: new Date().toISOString() });
  if (email !== 403 || direct !== 404) {
    notify(`Deployed ${target.slice(0, 7)}, BUT the contact form check failed (/api/send-email ${email}, direct PHP ${direct}). Check the email handler on 20i now.`);
    process.exit(1);
  }
  if (verified === 3) notify(`Deployed ${target.slice(0, 7)}, but 20i rate-limited the live check, so it is unverified. Please glance at the site.`);
  else notify(`Live: ${subject}`);
} catch (error) {
  if (target) saveState({ failed: target });
  notify(`Deploy failed: ${error.message}`);
  process.exit(1);
}
