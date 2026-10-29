// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import editorialHolds from '../data/editorial-holds.json';
import { blogPosts } from '../data/content';
import { generateSitemap } from '../scripts/generate-sitemap.js';
import { getAllRoutes } from '../scripts/prerender.js';

// Well past every planned date in the hold list, so the clock alone would publish them.
const AFTER_ALL_PLANNED_DATES = new Date('2027-03-01T12:00:00Z');
const PUBLISHED_SLUG = 'staff-using-ai-at-work-company-data'; // Sep 1, 2026
const held = editorialHolds.slugs;

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

describe('editorial hold list', () => {
  // Unapproved drafts are kept outside this repository. A slug is listed only
  // while its article is here for preview, and is removed in its release commit.
  it('lists only unique slugs of articles present in the source', () => {
    expect(new Set(held).size).toBe(held.length);
    for (const slug of held) {
      const post = blogPosts.find(p => p.slug === slug);
      expect(post?.content.length).toBeGreaterThan(0);
    }
    expect(held).not.toContain(PUBLISHED_SLUG);
  });
});

describe('held posts stay out of build outputs after their planned dates', () => {
  it('sitemap excludes held slugs and keeps published ones', async () => {
    const write = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AFTER_ALL_PLANNED_DATES);
    await generateSitemap();
    const xml = String(write.mock.calls[0][1]);
    for (const slug of held) expect(xml).not.toContain(`/blog/${slug}<`);
    expect(xml).toContain(`/blog/${PUBLISHED_SLUG}<`);
  });

  it('prerender route list excludes held slugs and keeps published ones', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AFTER_ALL_PLANNED_DATES);
    const routes = getAllRoutes();
    for (const slug of held) expect(routes).not.toContain(`/blog/${slug}`);
    expect(routes).toContain(`/blog/${PUBLISHED_SLUG}`);
  });
});

describe('scheduled publish function under hold', () => {
  it('returns without reading the feed or calling the build hook, whatever the date or hold list', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('NETLIFY_BUILD_HOOK_URL', 'https://example.invalid/hook');
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AFTER_ALL_PLANNED_DATES);
    // @ts-expect-error Directly exercise the JavaScript Netlify handler.
    const { default: handler, config } = await import('../netlify/functions/publish-scheduled-posts.mjs');
    const res = await handler();
    expect(await res.text()).toBe('editorial hold');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(config.schedule).toBe('15 6 * * *');
  });
});
