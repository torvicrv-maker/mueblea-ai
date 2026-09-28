const test = require('node:test');
const assert = require('node:assert/strict');

const { buildWardrobe } = require('../.test-dist/core/furniture/buildWardrobe.js');
const { boardAreaM2, edgeLengthM } = require('../.test-dist/core/furniture/metrics.js');
const { partWorldSize } = require('../.test-dist/core/furniture/worldSize.js');
const { validateFurnitureModel } = require('../.test-dist/core/furniture/validateFurnitureModel.js');
const { proposeFurnitureDimensions } = require('../.test-dist/core/furniture/promptProposal.js');
const { readSavedProjects, writeSavedProjects } = require('../.test-dist/core/furniture/projectStorage.js');

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

test('text proposals understand metric dimensions and keep unsupported layout changes explicit', () => {
  const proposal = proposeFurnitureDimensions(
    'Un clóset de 2,40 m de ancho, 2,30 m de alto y 60 cm de fondo, con seis cajones',
    { width: 2400, height: 2300, depth: 600 }
  );

  assert.equal(proposal.status, 'ready');
  assert.deepEqual(proposal.dimensions, { width: 2400, height: 2300, depth: 600 });
  assert.deepEqual(proposal.changedKeys, ['width', 'height', 'depth']);
  assert.match(proposal.warnings[0], /distribución interior/);
});

test('text proposals can parse a dimension triplet and reject dimensions below minimum', () => {
  const valid = proposeFurnitureDimensions('2400 x 2300 x 600 mm', { width: 1200, height: 2000, depth: 450 });
  const invalid = proposeFurnitureDimensions('clóset de 30 cm de ancho', { width: 2400, height: 2300, depth: 600 });

  assert.equal(valid.status, 'ready');
  assert.deepEqual(valid.dimensions, { width: 2400, height: 2300, depth: 600 });
  assert.equal(invalid.status, 'invalid');
  assert.deepEqual(invalid.dimensions, { width: 2400, height: 2300, depth: 600 });
});

test('saved projects use a versioned storage envelope and reject corrupt records', () => {
  const projects = [{
    id: 'project-1',
    name: 'Clóset dormitorio',
    dimensions: { width: 2400, height: 2300, depth: 600 },
    material: 'oak',
    updatedAt: '2026-09-28T12:00:00.000Z',
  }];
  const parsed = readSavedProjects(writeSavedProjects(projects));

  assert.deepEqual(parsed, projects);
  assert.deepEqual(readSavedProjects('{broken'), []);
  assert.deepEqual(readSavedProjects(JSON.stringify({ version: 2, projects })), []);
  assert.deepEqual(readSavedProjects(JSON.stringify({ version: 1, projects: [{ ...projects[0], dimensions: { width: NaN, height: 1, depth: 1 } }] })), []);
});
