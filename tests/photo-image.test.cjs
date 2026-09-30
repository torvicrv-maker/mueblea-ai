const test = require('node:test');
const assert = require('node:assert/strict');

const { inspectPhotoDataUri, MAX_PHOTO_DATA_URI_BYTES } = require('../.test-dist/core/photoImage.js');

test('accepts a compact JPEG data URI and reports its decoded size', () => {
  const value = `data:image/jpeg;base64,${Buffer.from('furniture').toString('base64')}`;

  assert.deepEqual(inspectPhotoDataUri(value), { mimeType: 'image/jpeg', byteLength: 9 });
});

test('rejects untrusted MIME types, malformed base64, and oversized photo payloads', () => {
  assert.equal(inspectPhotoDataUri('data:image/png;base64,aGVsbG8='), null);
  assert.equal(inspectPhotoDataUri('data:image/jpeg;base64,abc'), null);

  const tooLarge = Buffer.alloc(MAX_PHOTO_DATA_URI_BYTES + 1).toString('base64');
  assert.equal(inspectPhotoDataUri(`data:image/jpeg;base64,${tooLarge}`), null);
});
