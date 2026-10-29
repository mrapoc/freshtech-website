import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import editorialHolds from '../data/editorial-holds.json';
import { blogPosts } from '../data/content';

// Unapproved drafts live outside this repository, so the real hold list is
// usually empty. Hold one published post to exercise the mechanism.
vi.mock('../data/editorial-holds.json', () => ({ default: { slugs: ['qr-code-scams-quishing-business'] } }));

const AFTER_ALL_PLANNED_DATES = new Date('2027-03-01T12:00:00Z');
const heldPost = blogPosts.find(p => p.slug === editorialHolds.slugs[0])!;
const publishedPost = blogPosts.find(p => p.slug === 'staff-using-ai-at-work-company-data')!;

afterEach(() => { cleanup(); vi.useRealTimers(); vi.resetModules(); document.head.innerHTML = ''; });

async function open(path: string) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(AFTER_ALL_PLANNED_DATES);
  // Listing data is computed at module load, so import after setting the clock.
  const { BlogPageV2 } = await import('../pages-v2/BlogPageV2');
  const { BlogPostPageV2 } = await import('../pages-v2/BlogPostPageV2');
  const router = createMemoryRouter([
    { path: '/blog', element: <BlogPageV2 /> },
    { path: '/blog/:slug', element: <BlogPostPageV2 /> },
  ], { initialEntries: [path] });
  render(<RouterProvider router={router} />);
}

describe('editorial hold in the browser after planned dates', () => {
  it('blog listing hides held posts and shows published ones', async () => {
    await open('/blog');
    expect(screen.queryByText(heldPost.title)).toBeNull();
    expect(screen.getAllByText(publishedPost.title).length).toBeGreaterThan(0);
  });

  it('related posts never link to a held post', async () => {
    await open(`/blog/${publishedPost.slug}`);
    const hrefs = screen.getAllByRole('link').map(a => a.getAttribute('href'));
    for (const slug of editorialHolds.slugs) expect(hrefs).not.toContain(`/blog/${slug}`);
  });

  it('a held article already public still renders at its own URL', async () => {
    await open(`/blog/${heldPost.slug}`);
    expect(screen.getByRole('heading', { level: 1, name: heldPost.title })).toBeInTheDocument();
  });
});
