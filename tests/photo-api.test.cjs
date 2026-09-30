const test = require('node:test');
const assert = require('node:assert/strict');

const endpoint = require('../.api-test-dist/api/design-from-photo.js').default;

const allowedOrigin = 'https://torvicrv-maker.github.io';
const proposal = {
  supported: true,
  summary: 'Clóset con dos módulos y una zona de colgado.',
  sections: [
    { widthRatio: 0.6, shelfCount: 2, hanging: true, frontStyle: 'open', drawerCount: 0 },
    { widthRatio: 0.4, shelfCount: 1, hanging: false, frontStyle: 'drawers', drawerCount: 3 },
  ],
  assumptions: ['El interior oculto queda como borrador.'],
};

function configureService(enabled = true) {
  process.env.MUEBLEA_ALLOWED_ORIGINS = allowedOrigin;
  process.env.OPENAI_API_KEY = 'test-only-key';
  process.env.MUEBLEA_VISION_ENABLED = enabled ? 'true' : 'false';
  process.env.MUEBLEA_VISION_MODEL = 'gpt-5.6';
}

function photoRequest({ origin = allowedOrigin, dimensions = { width: 2400, height: 2300, depth: 600 } } = {}) {
  return new Request('https://api.example.com/api/design-from-photo', {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      'x-forwarded-for': `192.0.2.${Math.floor(Math.random() * 200) + 1}`,
    },
    body: JSON.stringify({ imageDataUri: 'data:image/jpeg;base64,Zm9v', dimensions, description: 'dos módulos' }),
  });
}

test('photo analysis stays disabled unless both server flags and provider key are set', async () => {
  configureService(false);
  const response = await endpoint.fetch(photoRequest());

  assert.equal(response.status, 503);
  assert.equal(response.headers.get('access-control-allow-origin'), allowedOrigin);
  assert.match((await response.json()).error, /aún no está configurado/);
});

test('photo endpoint rejects unknown origins before calling the AI provider', async () => {
  configureService(true);
  const previousFetch = global.fetch;
  let providerCalls = 0;
  global.fetch = async () => { providerCalls += 1; throw new Error('must not call provider'); };
  try {
    const response = await endpoint.fetch(photoRequest({ origin: 'https://attacker.invalid' }));
    assert.equal(response.status, 403);
    assert.equal(providerCalls, 0);
  } finally {
    global.fetch = previousFetch;
  }
});

test('photo endpoint sends the uploaded image and dimensions to structured vision and returns a validated proposal', async () => {
  configureService(true);
  const previousFetch = global.fetch;
  let providerPayload;
  global.fetch = async (url, init) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    providerPayload = JSON.parse(init.body);
    return new Response(JSON.stringify({
      output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(proposal) }] }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const response = await endpoint.fetch(photoRequest());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), allowedOrigin);
    assert.deepEqual(await response.json(), {
      supported: true,
      summary: proposal.summary,
      layout: { sections: proposal.sections },
      assumptions: proposal.assumptions,
    });
    assert.equal(providerPayload.model, 'gpt-5.6');
    assert.equal(providerPayload.store, false);
    assert.equal(providerPayload.input[1].content[1].image_url, 'data:image/jpeg;base64,Zm9v');
    assert.match(providerPayload.input[1].content[0].text, /2400/);
    assert.equal(providerPayload.text.format.type, 'json_schema');
  } finally {
    global.fetch = previousFetch;
  }
});

test('photo endpoint rejects a layout that cannot fit the entered width', async () => {
  configureService(true);
  const previousFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify({
    output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({
      supported: true,
      summary: 'Clóset dividido en cuatro módulos.',
      sections: Array.from({ length: 4 }, () => ({ widthRatio: 0.25, shelfCount: 1, hanging: false, frontStyle: 'open', drawerCount: 0 })),
      assumptions: [],
    }) }] }],
  }), { status: 200 });
  try {
    const response = await endpoint.fetch(photoRequest({ dimensions: { width: 400, height: 2300, depth: 600 } }));
    assert.equal(response.status, 422);
    assert.match((await response.json()).error, /no cabe/);
  } finally {
    global.fetch = previousFetch;
  }
});
