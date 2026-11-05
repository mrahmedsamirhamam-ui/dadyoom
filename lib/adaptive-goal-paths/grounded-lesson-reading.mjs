/**
 * Split the published lesson text into readable mobile-sized steps.
 * Lossless: the joined steps are the original EXACT string, without invented
 * summaries, truncation, replacement, remote AI calls, or textbook claims.
 */
export function splitPublishedLessonIntoSteps(content, maxCharacters = 720) {
  if (typeof content !== "string" || !content) return [];
  if (!Number.isInteger(maxCharacters) || maxCharacters < 80 || maxCharacters > 4000) {
    throw new RangeError("maxCharacters must be an integer between 80 and 4000");
  }
  // Split only at whitespace or punctuation boundaries. Never remove separators.
  const fragments = content.split(/(?<=\n)|(?<=[.!؟؛])(?=\s)/u);
  const tokens = [];
  for (const fragment of fragments) {
    if (fragment.length > maxCharacters) {
      tokens.push(...fragment.split(/(?<=\s)/u));
    } else if (fragment) {
      tokens.push(fragment);
    }
  }
  const steps = [];
  let current = "";
  for (const token of tokens) {
    if (current && current.length + token.length > maxCharacters) {
      steps.push(current);
      current = "";
    }
    current += token;
  }
  if (current) steps.push(current);
  return steps;
}

/**
 * Keep learning goals exactly as provided by the published record: an empty
 * list is NOT permission to fabricate a measurable curriculum objective.
 */
export function listPublishedGoalChoices(objectives) {
  if (!Array.isArray(objectives)) return [];
  return objectives.filter(item => typeof item === "string" && item.trim().length > 0);
}

export const READING_PATHS = Object.freeze([
  Object.freeze({ id: "start", title: "مسار البداية", hint: "أقرأ خطوة خطوة" }),
  Object.freeze({ id: "progress", title: "مسار التقدم", hint: "أربط أجزاء الدرس" }),
  Object.freeze({ id: "challenge", title: "مسار التحدي", hint: "أستدل وأفسر" }),
]);
