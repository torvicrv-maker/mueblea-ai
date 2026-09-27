const test = require('node:test');
const assert = require('node:assert/strict');

const { buildWardrobe } = require('../.test-dist/core/furniture/buildWardrobe.js');
const { boardAreaM2, edgeLengthM } = require('../.test-dist/core/furniture/metrics.js');
const { partWorldSize } = require('../.test-dist/core/furniture/worldSize.js');
const { validateFurnitureModel } = require('../.test-dist/core/furniture/validateFurnitureModel.js');

function byId(model, id) {
  const part = model.parts.find((item) => item.id === id);
  assert.ok(part, `Expected part ${id}`);
  return part;
}

test('default wardrobe is deterministic and valid', () => {
  const a = buildWardrobe({ width: 2400, height: 2300, depth: 600 });
  const b = buildWardrobe({ width: 2400, height: 2300, depth: 600 });

  assert.deepEqual(a, b);
  assert.equal(a.parts.length, 5);
  assert.deepEqual(validateFurnitureModel(a), []);
});

test('manufacturing dimensions remain independent from 3D orientation', () => {
  const model = buildWardrobe({ width: 2400, height: 2300, depth: 600 });
  const side = byId(model, 'side-left');
  const top = byId(model, 'top');

  assert.deepEqual(
    { length: side.length, width: side.width, thickness: side.thickness },
    { length: 2300, width: 600, thickness: 18 }
  );
  assert.deepEqual(partWorldSize(side), [18, 2300, 600]);

  assert.deepEqual(
    { length: top.length, width: top.width, thickness: top.thickness },
    { length: 2364, width: 600, thickness: 18 }
  );
  assert.deepEqual(partWorldSize(top), [2364, 18, 600]);
});

test('cut-list metrics are reproducible from the canonical model', () => {
  const model = buildWardrobe({ width: 2400, height: 2300, depth: 600 });

  assert.equal(boardAreaM2(model), 6.96792);
  assert.equal(edgeLengthM(model), 11.692);
});

test('template rejects dimensions below its constructive minimum', () => {
  assert.throws(
    () => buildWardrobe({ width: 399, height: 2300, depth: 600 }),
    /demasiado pequeño/
  );
  assert.throws(
    () => buildWardrobe({ width: 2400, height: 499, depth: 600 }),
    /demasiado pequeño/
  );
  assert.throws(
    () => buildWardrobe({ width: 2400, height: 2300, depth: 249 }),
    /demasiado pequeño/
  );
});

test('validator detects duplicate ids and invalid runtime geometry', () => {
  const model = buildWardrobe({ width: 2400, height: 2300, depth: 600 });
  const broken = structuredClone(model);

  broken.parts[1].id = broken.parts[0].id;
  broken.parts[2].length = 0;
  broken.parts[3].orientation = {
    lengthAxis: 'x',
    widthAxis: 'x',
    thicknessAxis: 'z',
  };

  const codes = validateFurnitureModel(broken).map((issue) => issue.code);
  assert.ok(codes.includes('DUPLICATE_PART_ID'));
  assert.ok(codes.includes('NON_POSITIVE_DIMENSION'));
  assert.ok(codes.includes('INVALID_ORIENTATION'));
});

test('validator detects pieces outside the furniture envelope', () => {
  const model = buildWardrobe({ width: 2400, height: 2300, depth: 600 });
  const broken = structuredClone(model);
  broken.parts[0].transform.x = -20;

  const codes = validateFurnitureModel(broken).map((issue) => issue.code);
  assert.ok(codes.includes('PART_OUTSIDE_ENVELOPE'));
});

test('all generated parts stay inside the furniture envelope', () => {
  const model = buildWardrobe({ width: 2400, height: 2300, depth: 600 });
  const epsilon = 1e-9;

  for (const part of model.parts) {
    const [sx, sy, sz] = partWorldSize(part);
    assert.ok(part.transform.x - sx / 2 >= -epsilon, `${part.id} crosses x-min`);
    assert.ok(part.transform.y - sy / 2 >= -epsilon, `${part.id} crosses y-min`);
    assert.ok(part.transform.z - sz / 2 >= -epsilon, `${part.id} crosses z-min`);
    assert.ok(part.transform.x + sx / 2 <= model.dimensions.width + epsilon, `${part.id} crosses x-max`);
    assert.ok(part.transform.y + sy / 2 <= model.dimensions.height + epsilon, `${part.id} crosses y-max`);
    assert.ok(part.transform.z + sz / 2 <= model.dimensions.depth + epsilon, `${part.id} crosses z-max`);
  }
});
