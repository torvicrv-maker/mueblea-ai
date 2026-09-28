const test = require('node:test');
const assert = require('node:assert/strict');

const { inspectImage3DDataUri, MAX_IMAGE_3D_DATA_URI_BYTES } = require('../.test-dist/core/image3d.js');

test('accepts a compact JPEG data URI and reports its decoded size', () => {
  const value = `data:image/jpeg;base64,${Buffer.from('furniture').toString('base64')}`;

  assert.deepEqual(inspectImage3DDataUri(value), { mimeType: 'image/jpeg', byteLength: 9 });
});

test('rejects untrusted MIME types, malformed base64, and oversized image payloads', () => {
  assert.equal(inspectImage3DDataUri('data:image/png;base64,aGVsbG8='), null);
  assert.equal(inspectImage3DDataUri('data:image/jpeg;base64,abc'), null);

  const tooLarge = Buffer.alloc(MAX_IMAGE_3D_DATA_URI_BYTES + 1).toString('base64');
  assert.equal(inspectImage3DDataUri(`data:image/jpeg;base64,${tooLarge}`), null);
});
