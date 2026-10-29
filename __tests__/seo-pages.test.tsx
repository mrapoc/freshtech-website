import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { BlogPostPageV2 } from '../pages-v2/BlogPostPageV2';
import { IndustryDetailPageV2 } from '../pages-v2/IndustryDetailPageV2';
import { blogPosts, industryPages } from '../data/content';

const post = blogPosts.find(value => new Date(value.date) < new Date('2026-09-01'))!;
const industry = Object.values(industryPages)[0];
afterEach(() => { cleanup(); document.head.innerHTML = ''; });

function open(path: string) {
  const router = createMemoryRouter([
    { path: '/blog/:slug', element: <BlogPostPageV2 /> },
    { path: '/industries/:slug', element: <IndustryDetailPageV2 /> },
  ], { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}
const canonical = () => document.querySelector('link[rel="canonical"]')?.getAttribute('href');
const robots = () => document.querySelector('meta[name="robots"]')?.getAttribute('content');
const schemaTypes = () => (JSON.parse(document.getElementById('json-ld-schema')?.textContent || '[]') as { '@type': string | string[] }[]).map(value => value['@type']);

describe('dynamic page SEO', () => {
  it.each(['/blog/missing-test-record', '/industries/missing-test-record'])('marks %s as missing on fresh navigation', path => {
    open(path);
    expect(screen.getByRole('heading', { level: 1, name: 'That page moved house.' })).toBeInTheDocument();
    expect(robots()).toContain('noindex');
    expect(canonical()).toBe(`https://fresh-tech.uk${path}`);
  });
  it.each([
    [`/blog/${post.slug}`, '/blog/missing-test-record', 'Article'],
    [`/industries/${industry.slug}`, '/industries/missing-test-record', 'Service'],
  ])('clears stale content metadata after %s', async (valid, missing, type) => {
    const router = open(valid);
    expect(schemaTypes()).toContain(type);
    await act(() => router.navigate(missing));
    expect(document.title).toContain('Page Not Found');
    expect(robots()).toContain('noindex');
    expect(canonical()).toBe(`https://fresh-tech.uk${missing}`);
    expect(schemaTypes()).not.toContain(type);
  });
  it('renders a trailing-slash article with a slashless canonical', () => {
    open(`/blog/${post.slug}/`);
    expect(screen.getByRole('heading', { level: 1, name: post.title })).toBeInTheDocument();
    expect(robots()).not.toContain('noindex');
    expect(canonical()).toBe(`https://fresh-tech.uk/blog/${post.slug}`);
  });
  it('preserves sector aliases even with trailing slashes', async () => {
    const router = open('/industries/legal/');
    await act(async () => {});
    expect(router.state.location.pathname).toBe('/industries/solicitors');
    expect(canonical()).toBe('https://fresh-tech.uk/industries/solicitors');
    expect(robots()).not.toContain('noindex');
  });
});
