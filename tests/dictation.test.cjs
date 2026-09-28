const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildSpeechRecognitionTranscript,
  buildDictationText,
} = require('../.test-dist/core/assistant/dictationTranscript.js');

function speechResults(...results) {
  return results.map(([transcript, isFinal]) => ({ 0: { transcript }, isFinal }));
}

test('cumulative interim hypotheses are merged once, matching the repeated-text failure', () => {
  const results = speechResults(
    ['Hola', false],
    ['Hola me', false],
    ['Hola me gustaría', false],
    ['Hola me gustaría que', false],
    ['Hola me gustaría que me ayudes', false],
  );

  assert.equal(buildSpeechRecognitionTranscript(results), 'Hola me gustaría que me ayudes');
});

test('final results are retained while overlapping interim fragments update cleanly', () => {
  const results = speechResults(
    ['Hola me gustaría', true],
    ['Hola me gustaría un clóset', false],
    ['Hola me gustaría un clóset de 2,4 metros', false],
  );

  assert.equal(buildSpeechRecognitionTranscript(results), 'Hola me gustaría un clóset de 2,4 metros');
});

test('separate interim fragments remain when they do not repeat earlier words', () => {
  const results = speechResults(
    ['Hola me gustaría', true],
    ['un clóset', false],
    ['con cajones', false],
  );

  assert.equal(buildSpeechRecognitionTranscript(results), 'Hola me gustaría un clóset con cajones');
});

test('dictation appends to existing text exactly once', () => {
  const recognizedText = buildSpeechRecognitionTranscript(speechResults(['ajústalo a 2,4 metros', true]));

  assert.equal(buildDictationText('Necesito un clóset', recognizedText), 'Necesito un clóset ajústalo a 2,4 metros');
});

test('distinct finalized repetitions remain intact', () => {
  const results = speechResults(['Hola', true], ['Hola', true]);

  assert.equal(buildSpeechRecognitionTranscript(results), 'Hola Hola');
});
