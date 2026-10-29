import assert from 'node:assert/strict';
import test from 'node:test';
import { PREVIEW_ROBOTS, PRODUCTION_ROBOTS, resolveSiteMode } from './site-mode.mjs';

test('resolveSiteMode defaults to preview and accepts only the two modes', () => {
  assert.equal(resolveSiteMode(undefined), 'preview');
  assert.equal(resolveSiteMode(''), 'preview');
  assert.equal(resolveSiteMode('preview'), 'preview');
  assert.equal(resolveSiteMode('production'), 'production');
  assert.throws(() => resolveSiteMode('Production'));
  assert.throws(() => resolveSiteMode('prod'));
});

test('robots directives match the React SEO formula and the preview default', () => {
  assert.equal(PRODUCTION_ROBOTS, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  assert.equal(PREVIEW_ROBOTS, 'noindex, nofollow');
});
