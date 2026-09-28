export interface SpeechRecognitionResultLike {
  readonly 0?: { readonly transcript?: string };
}

export function replaceUpdatedSpeechResults(
  previousSegments: readonly string[],
  resultIndex: number,
  results: ArrayLike<SpeechRecognitionResultLike>,
): string[] {
  const nextSegments = previousSegments.slice(0, Math.max(0, Math.min(results.length, resultIndex)));

  for (let index = nextSegments.length; index < results.length; index += 1) {
    nextSegments[index] = results[index]?.[0]?.transcript?.trim() ?? "";
  }

  nextSegments.length = results.length;
  return nextSegments;
}

export function buildDictationText(baseText: string, segments: readonly string[]): string {
  const recognizedText = segments.map((segment) => segment.trim()).filter(Boolean).join(" ");
  return [baseText.trim(), recognizedText].filter(Boolean).join(" ");
}
