const test = require('node:test');
const assert = require('node:assert/strict');

const { buildWardrobe } = require('../.test-dist/core/furniture/buildWardrobe.js');
const { boardAreaM2, edgeLengthM } = require('../.test-dist/core/furniture/metrics.js');
const { partWorldSize } = require('../.test-dist/core/furniture/worldSize.js');
const { validateFurnitureModel } = require('../.test-dist/core/furniture/validateFurnitureModel.js');
const { proposeFurnitureDimensions } = require('../.test-dist/core/furniture/promptProposal.js');
const { readSavedProjects, writeSavedProjects } = require('../.test-dist/core/furniture/projectStorage.js');
const { parsePhotoDesignProposal } = require('../.test-dist/core/furniture/photoProposal.js');
const { DEFAULT_WARDROBE_LAYOUT } = require('../.test-dist/core/furniture/wardrobeLayout.js');

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

test('photo layout builds partitions, shelves, and drawer fronts into one valid parametric model', () => {
  const model = buildWardrobe({
    width: 2400,
    height: 2300,
    depth: 600,
    layout: {
      sections: [
        { widthRatio: 0.62, shelfCount: 2, hanging: true, frontStyle: 'open', drawerCount: 0 },
        { widthRatio: 0.38, shelfCount: 1, hanging: false, frontStyle: 'drawers', drawerCount: 3 },
      ],
    },
  });

  assert.equal(model.parts.length, 11);
  assert.equal(model.parts.filter((part) => part.id.startsWith('drawer-front-')).length, 3);
  assert.equal(model.parts.filter((part) => part.id.startsWith('shelf-')).length, 3);
  assert.ok(byId(model, 'partition-01'));
  assert.equal(validateFurnitureModel(model).length, 0);
  assert.ok(boardAreaM2(model) > 0);
  assert.ok(edgeLengthM(model) > 0);

  for (const part of model.parts) {
    const [sx, sy, sz] = partWorldSize(part);
    assert.ok(part.transform.x - sx / 2 >= 0, `${part.id} crosses x-min`);
    assert.ok(part.transform.y - sy / 2 >= 0, `${part.id} crosses y-min`);
    assert.ok(part.transform.z - sz / 2 >= 0, `${part.id} crosses z-min`);
    assert.ok(part.transform.x + sx / 2 <= model.dimensions.width, `${part.id} crosses x-max`);
    assert.ok(part.transform.y + sy / 2 <= model.dimensions.height, `${part.id} crosses y-max`);
    assert.ok(part.transform.z + sz / 2 <= model.dimensions.depth, `${part.id} crosses z-max`);
  }
});

test('photo layout creates separate door panels and rejects impossible narrow sections', () => {
  const model = buildWardrobe({
    width: 2400,
    height: 2300,
    depth: 600,
    layout: { sections: [{ widthRatio: 1, shelfCount: 2, hanging: false, frontStyle: 'doors', drawerCount: 0 }] },
  });
  assert.equal(model.parts.filter((part) => part.id.startsWith('door-')).length, 2);
  assert.equal(validateFurnitureModel(model).length, 0);

  assert.throws(() => buildWardrobe({
    width: 400,
    height: 2300,
    depth: 600,
    layout: { sections: Array.from({ length: 4 }, () => ({ widthRatio: 1, shelfCount: 0, hanging: false, frontStyle: 'open', drawerCount: 0 })) },
  }), /demasiado estrechos/);
});

test('photo proposal parser validates its typed layout and handles unsupported images', () => {
  const valid = parsePhotoDesignProposal({
    supported: true,
    summary: 'Clóset con dos módulos.',
    sections: [{ widthRatio: 0.7, shelfCount: 2, hanging: true, frontStyle: 'open', drawerCount: 0 }, { widthRatio: 0.3, shelfCount: 1, hanging: false, frontStyle: 'drawers', drawerCount: 3 }],
    assumptions: ['El interior oculto se propone como borrador.'],
  });
  const invalid = parsePhotoDesignProposal({ supported: true, summary: 'No válido', sections: [{ widthRatio: 0, shelfCount: 20, hanging: false, frontStyle: 'drawers', drawerCount: 0 }], assumptions: [] });
  const unsupported = parsePhotoDesignProposal({ supported: false, summary: 'La imagen no muestra un clóset.', sections: [], assumptions: [] });
  const normalizedResponse = parsePhotoDesignProposal({ supported: true, summary: 'Clóset propuesto.', layout: { sections: valid.layout.sections }, assumptions: [] });

  assert.ok(valid);
  assert.equal(valid.layout.sections.length, 2);
  assert.equal(Math.round(valid.layout.sections[0].widthRatio * 100), 70);
  assert.equal(invalid, null);
  assert.deepEqual(normalizedResponse.layout, valid.layout);
  assert.deepEqual(unsupported, { supported: false, summary: 'La imagen no muestra un clóset.', layout: null, assumptions: [] });
});

test('text proposals understand metric dimensions and keep unsupported layout changes explicit', () => {
  const proposal = proposeFurnitureDimensions(
    'Un clóset de 2,40 m de ancho, 2,30 m de alto y 60 cm de fondo, con seis cajones',
    { width: 2400, height: 2300, depth: 600 }
  );

  assert.equal(proposal.status, 'ready');
  assert.deepEqual(proposal.dimensions, { width: 2400, height: 2300, depth: 600 });
  assert.deepEqual(proposal.changedKeys, ['width', 'height', 'depth']);
  assert.deepEqual(proposal.action, {
    type: 'SET_DIMENSIONS',
    payload: { width: 2400, height: 2300, depth: 600 },
  });
  assert.match(proposal.warnings[0], /distribución interior/);
});

test('text proposals can parse a dimension triplet and reject dimensions below minimum', () => {
  const valid = proposeFurnitureDimensions('2400 x 2300 x 600 mm', { width: 1200, height: 2000, depth: 450 });
  const invalid = proposeFurnitureDimensions('clóset de 30 cm de ancho', { width: 2400, height: 2300, depth: 600 });

  assert.equal(valid.status, 'ready');
  assert.deepEqual(valid.dimensions, { width: 2400, height: 2300, depth: 600 });
  assert.equal(valid.action.type, 'SET_DIMENSIONS');
  assert.equal(invalid.status, 'invalid');
  assert.equal(invalid.action, null);
  assert.deepEqual(invalid.dimensions, { width: 2400, height: 2300, depth: 600 });
});

test('unsupported layout requests do not create a furniture action', () => {
  const proposal = proposeFurnitureDimensions('Pon seis cajones y un espacio para colgar', { width: 2400, height: 2300, depth: 600 });

  assert.equal(proposal.status, 'no_dimensions');
  assert.equal(proposal.action, null);
  assert.match(proposal.warnings[0], /distribución interior/);
});

test('saved projects use a versioned storage envelope and reject corrupt records', () => {
  const projects = [{
    id: 'project-1',
    name: 'Clóset dormitorio',
    dimensions: { width: 2400, height: 2300, depth: 600 },
    material: 'oak',
    layout: structuredClone(DEFAULT_WARDROBE_LAYOUT),
    updatedAt: '2026-09-28T12:00:00.000Z',
  }];
  const parsed = readSavedProjects(writeSavedProjects(projects));

  assert.deepEqual(parsed, projects);
  const legacyProject = { ...projects[0] };
  delete legacyProject.layout;
  assert.deepEqual(readSavedProjects(JSON.stringify({ version: 1, projects: [legacyProject] }))[0].layout, DEFAULT_WARDROBE_LAYOUT);
  assert.deepEqual(readSavedProjects('{broken'), []);
  assert.deepEqual(readSavedProjects(JSON.stringify({ version: 2, projects })), []);
  assert.deepEqual(readSavedProjects(JSON.stringify({ version: 1, projects: [{ ...projects[0], dimensions: { width: NaN, height: 1, depth: 1 } }] })), []);
});
