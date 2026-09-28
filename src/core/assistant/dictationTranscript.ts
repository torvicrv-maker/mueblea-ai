export interface SpeechRecognitionResultLike {
  readonly 0?: { readonly transcript?: string };
  readonly isFinal: boolean;
}

function getNormalizedWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map((word) =>
      word
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("es-EC")
        .replace(/[^\p{Letter}\p{Number}]/gu, ""),
    )
    .filter(Boolean);
}

function isWordPrefix(prefix: readonly string[], text: readonly string[]): boolean {
  return prefix.length <= text.length && prefix.every((word, index) => word === text[index]);
}

function mergeSpeechFragments(fragments: readonly string[]): string {
  let merged = "";

  for (const rawFragment of fragments) {
    const fragment = rawFragment.trim();
    if (!fragment) continue;
    if (!merged) {
      merged = fragment;
      continue;
    }

    const currentWords = getNormalizedWords(merged);
    const nextWords = getNormalizedWords(fragment);
    if (currentWords.length === 0 || nextWords.length === 0) {
      merged = `${merged} ${fragment}`;
      continue;
    }

    if (isWordPrefix(currentWords, nextWords)) {
      if (nextWords.length > currentWords.length) merged = fragment;
      continue;
    }
    if (isWordPrefix(nextWords, currentWords)) continue;

    const currentTokens = merged.split(/\s+/).filter((token) => getNormalizedWords(token).length > 0);
    const nextTokens = fragment.split(/\s+/).filter((token) => getNormalizedWords(token).length > 0);
    const maxOverlap = Math.min(currentWords.length, nextWords.length);
    let overlap = 0;
    for (let length = maxOverlap; length > 0; length -= 1) {
      if (currentWords.slice(-length).every((word, index) => word === nextWords[index])) {
        overlap = length;
        break;
      }
    }

    merged = overlap > 0
      ? [...currentTokens, ...nextTokens.slice(overlap)].join(" ")
      : `${merged} ${fragment}`;
  }

  return merged;
}

export function buildSpeechRecognitionTranscript(results: ArrayLike<SpeechRecognitionResultLike>): string {
  const finalSegments: string[] = [];
  const interimSegments: string[] = [];

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    const transcript = result?.[0]?.transcript?.trim() ?? "";
    if (!transcript) continue;

    if (result.isFinal) finalSegments.push(transcript);
    else interimSegments.push(transcript);
  }

  const finalTranscript = finalSegments.join(" ");
  const interimTranscript = mergeSpeechFragments(interimSegments);
  return mergeSpeechFragments([finalTranscript, interimTranscript]);
}

export function buildDictationText(baseText: string, recognizedText: string): string {
  return [baseText.trim(), recognizedText.trim()].filter(Boolean).join(" ");
}
