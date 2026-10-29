// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { generateSitemap, toISODate } from '../scripts/generate-sitemap.js';

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe('sitemap publication evidence', () => {
  it('keeps calendar publication dates in summer and winter and rejects invalid dates', () => {
    expect(toISODate('Sep 3, 2026')).toBe('2026-09-03');
    expect(toISODate('Jan 3, 2026')).toBe('2026-01-03');
    expect(toISODate('2026-09-03')).toBe('2026-09-03');
    expect(toISODate('not a date')).toBeUndefined();
  });

  it('includes existing author profiles without inventing non-blog modification dates', async () => {
    const write = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
    await generateSitemap();
    const first = String(write.mock.calls[0][1]);
    expect(first).toContain('<loc>https://fresh-tech.uk/team/sam-james</loc>');
    expect(first).toContain('<loc>https://fresh-tech.uk/team/matt-morgan</loc>');
    const blocks = first.match(/<url>[\s\S]*?<\/url>/g)!;
    for (const block of blocks.filter(value => !value.includes('/blog/'))) {
      expect(block).not.toContain('<lastmod>');
    }
    expect(blocks.some(value => value.includes('/blog/') && value.includes('<lastmod>'))).toBe(true);
    vi.setSystemTime(new Date('2026-09-11T12:00:00Z'));
    await generateSitemap();
    const nextBlocks = String(write.mock.calls[1][1]).match(/<url>[\s\S]*?<\/url>/g)!;
    expect(nextBlocks.filter(value => !value.includes('/blog/'))).toEqual(blocks.filter(value => !value.includes('/blog/')));
  });
});

describe('Google notification eligibility boundary', () => {
  const run = (...args: string[]) => spawnSync(process.execPath, ['scripts/gsc-submit.mjs', ...args], {
    cwd: process.cwd(), encoding: 'utf8',
    env: { ...process.env, GSC_SA_KEY: '', GSC_KEY_FILE: 'nonexistent-test-key.json' },
  });
  it('rejects ordinary and automatic submissions before attempting credentials', () => {
    for (const args of [[], ['--new-vs-live'], ['https://fresh-tech.uk/blog/example']]) {
      const result = run(...args);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('only supports verified');
      expect(result.stderr).not.toContain('ENOENT');
    }
  });
  it('allows an explicitly declared eligible dry run without credentials or network', () => {
    const result = run('--eligible-type=JobPosting', '--dry-run', 'https://fresh-tech.uk/jobs/example');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[dry-run]');
    expect(result.stdout).toContain('/jobs/example');
  });
});
