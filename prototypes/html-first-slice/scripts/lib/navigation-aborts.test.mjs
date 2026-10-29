import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import { trackSupersededAborts } from './navigation-aborts.mjs';

const fakePage = () => {
  const page = new EventEmitter();
  const mainFrame = {};
  page.mainFrame = () => mainFrame;
  return { page, mainFrame };
};
const request = errorText => ({ failure: () => (errorText ? { errorText } : null) });

test('ignores only aborts of requests issued before the latest main-frame navigation', () => {
  const { page, mainFrame } = fakePage();
  const superseded = trackSupersededAborts(page);
  const oldFont = request('net::ERR_ABORTED');
  const oldMissing = request('net::ERR_FAILED');
  page.emit('request', oldFont);
  page.emit('request', oldMissing);
  assert.equal(superseded(oldFont), false, 'no navigation yet');
  page.emit('framenavigated', {});
  assert.equal(superseded(oldFont), false, 'child frame navigations do not count');
  page.emit('framenavigated', mainFrame);
  assert.equal(superseded(oldFont), true);
  assert.equal(superseded(oldMissing), false, 'other failures are always reported');
  const currentFont = request('net::ERR_ABORTED');
  page.emit('request', currentFont);
  assert.equal(superseded(currentFont), false, 'aborts on the current document are reported');
  assert.equal(superseded(request('net::ERR_ABORTED')), false, 'untracked requests are reported');
});
