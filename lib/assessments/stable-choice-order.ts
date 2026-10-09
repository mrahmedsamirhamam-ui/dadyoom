/**
 * Display-only deterministic shuffle of multiple-choice options.
 * The database option IDs and correct_answer IDs are never rewritten.
 * Stable between server/client renders, rerenders and retries: no hydration drift.
 */
export function stableChoiceOrder<T extends { id: string }>(
  choices: readonly T[],
  questionId: string,
): T[] {
  const shuffled = [...choices];
  if (shuffled.length <= 1) return shuffled;

  let state = 2166136261;
  for (let i = 0; i < questionId.length; i += 1) {
    state = Math.imul(state ^ questionId.charCodeAt(i), 16777619);
  }
  // Fisher-Yates using a deterministic per-question xorshift sequence.
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const j = (state >>> 0) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
