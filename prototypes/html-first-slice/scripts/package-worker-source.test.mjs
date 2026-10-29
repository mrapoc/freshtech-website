import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  assertArchiveMatchesManifest,
  createSourceArchive,
  validateManifest,
  validateOutputPath,
  validatePath,
} from './package-worker-source.mjs';

test('packages literal bracket paths and verifies exact archive membership', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'freshtech-worker-package-'));
  const entries = ['brand/font.woff2', 'src/pages/services/[slug].astro'];
  for (const entry of entries) {
    await mkdir(join(rootDir, ...entry.split('/').slice(0, -1)), { recursive: true });
    await writeFile(join(rootDir, ...entry.split('/')), entry);
  }
  const manifestPath = join(rootDir, 'manifest.txt');
  const outputPath = join(rootDir, 'source.tgz');
  await writeFile(manifestPath, `${entries.join('\n')}\n`);
  const result = await createSourceArchive({ rootDir, manifestPath, outputPath, requiredPaths: entries });
  assert.deepEqual(result.entries, entries);
  assert.match(result.sha256, /^[A-F0-9]{64}$/);
});

test('rejects secret and customer fixture paths', () => {
  assert.throws(() => validatePath('.env.production'), /Forbidden/);
  assert.throws(() => validatePath('test/customer-fixtures/example.json'), /Forbidden/);
  assert.throws(() => validatePath('test/customer-fixtures.json'), /Forbidden/);
});

test('rejects unsafe and non-portable path components', () => {
  for (const entry of ['a//b', 'a/./b', 'a/../b', 'a:b', 'a\nb', 'a/@list']) {
    assert.throws(() => validatePath(entry), /Unsafe|Unsupported/);
  }
});

test('rejects a symlink source root before archiving', async () => {
  await assert.rejects(
    validateManifest('root', ['safe.txt'], {
      requiredPaths: ['safe.txt'],
      inspect: async () => ({ isSymbolicLink: () => true, isDirectory: () => false, isFile: () => true }),
    }),
    /root is a symlink/,
  );
});

test('rejects a symlinked parent within a source path', async () => {
  let inspections = 0;
  await assert.rejects(
    validateManifest('root', ['parent/safe.txt'], {
      requiredPaths: ['parent/safe.txt'],
      inspect: async () => {
        inspections += 1;
        return {
          isSymbolicLink: () => inspections === 2,
          isDirectory: () => true,
          isFile: () => inspections === 3,
        };
      },
    }),
    /crosses a symlink/,
  );
});

test('rejects omitted required inputs before inspecting files', async () => {
  await assert.rejects(
    validateManifest('root', ['src/pages/services/[slug].astro'], {
      requiredPaths: ['brand/font.woff2', 'src/pages/services/[slug].astro'],
      inspect: async () => ({ isSymbolicLink: () => false, isDirectory: () => true, isFile: () => true }),
    }),
    /Required worker source path is missing: brand\/font\.woff2/,
  );
});

test('requires an unused tgz output outside protected inputs', async () => {
  assert.throws(() => validateOutputPath('root', 'root/manifest.txt', ['source.tgz'], 'root/source.tgz'), /overlaps/);
  assert.throws(() => validateOutputPath('root', 'root/manifest.txt', [], 'archive.zip'), /must end in \.tgz/);

  const rootDir = await mkdtemp(join(tmpdir(), 'freshtech-worker-no-clobber-'));
  await writeFile(join(rootDir, 'safe.txt'), 'source');
  await writeFile(join(rootDir, 'manifest.txt'), 'safe.txt\n');
  await writeFile(join(rootDir, 'archive.tgz'), 'keep me');
  await assert.rejects(
    createSourceArchive({
      rootDir,
      manifestPath: join(rootDir, 'manifest.txt'),
      outputPath: join(rootDir, 'archive.tgz'),
      requiredPaths: ['safe.txt'],
    }),
    /already exists/,
  );
  assert.equal(await readFile(join(rootDir, 'archive.tgz'), 'utf8'), 'keep me');
});

test('rejects archive and manifest mismatches', () => {
  assert.throws(
    () => assertArchiveMatchesManifest(['src/pages/services/[slug].astro'], ['src/pages/services/index.astro']),
    /differs from manifest/,
  );
});
