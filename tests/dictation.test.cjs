const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildDictationText,
  replaceUpdatedSpeechResults,
} = require('../.test-dist/core/assistant/dictationTranscript.js');

function speechResults(...transcripts) {
  return transcripts.map((transcript) => ({ 0: { transcript } }));
}

test('interim dictation updates replace the previous hypothesis instead of duplicating it', () => {
  let segments = [];
  segments = replaceUpdatedSpeechResults(segments, 0, speechResults('Hola'));
  assert.equal(buildDictationText('', segments), 'Hola');

  segments = replaceUpdatedSpeechResults(segments, 0, speechResults('Hola me'));
  assert.equal(buildDictationText('', segments), 'Hola me');

  segments = replaceUpdatedSpeechResults(segments, 0, speechResults('Hola me gustaría'));
  assert.equal(buildDictationText('', segments), 'Hola me gustaría');
});

test('new speech segments preserve finalized text and replace only the changed result', () => {
  let segments = replaceUpdatedSpeechResults([], 0, speechResults('Hola me gustaría'));
  segments = replaceUpdatedSpeechResults(segments, 1, speechResults('Hola me gustaría', 'un clóset'));
  segments = replaceUpdatedSpeechResults(segments, 1, speechResults('Hola me gustaría', 'un clóset de 2,4 metros'));

  assert.equal(buildDictationText('', segments), 'Hola me gustaría un clóset de 2,4 metros');
});

test('dictation appends to existing text exactly once', () => {
  const segments = replaceUpdatedSpeechResults([], 0, speechResults('ajústalo a 2,4 metros'));

  assert.equal(buildDictationText('Necesito un clóset', segments), 'Necesito un clóset ajústalo a 2,4 metros');
});
