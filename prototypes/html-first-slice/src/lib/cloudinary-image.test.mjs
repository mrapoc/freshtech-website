import assert from 'node:assert/strict';
import test from 'node:test';
import { cloudinarySrcset } from './cloudinary-image.mjs';

const base = 'https://res.cloudinary.com/djkmeg5se/image/upload/';
test('stored Cloudinary shapes all gain sized, auto-format candidates', () => {
  for (const [url, id] of [[`${base}a.jpg`, 'a.jpg'], [`${base}v17/a.jpg`, 'v17/a.jpg'], [`${base}f_auto,q_auto/a.jpg`, 'a.jpg'], [`${base}f_auto,q_auto/v17/a.jpg`, 'v17/a.jpg']]) {
    assert.equal(cloudinarySrcset(url, [480, 720]), `${base}f_auto,q_auto,w_480/${id} 480w, ${base}f_auto,q_auto,w_720/${id} 720w`, url);
  }
});
test('video posters, sized transformations and non-Cloudinary URLs are left alone', () => {
  assert.equal(cloudinarySrcset('https://res.cloudinary.com/djkmeg5se/video/upload/so_2,w_1200/x.jpg', [480]), undefined);
  assert.equal(cloudinarySrcset(`${base}w_200,f_auto,q_auto/a.png`, [480]), undefined);
  assert.equal(cloudinarySrcset('https://example.com/a.jpg', [480]), undefined);
  assert.equal(cloudinarySrcset(undefined, [480]), undefined);
});
