import type { QuestionRow } from "./lesson-game-pack";

/** Lesson activities are authored teaching aids, not official-book evidence. */
export type PublishedMultipleChoiceActivity = {
  prompt?: string | null;
  content?: unknown;
  answer?: unknown;
};

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

/**
 * Convert only unambiguous, already-published multiple-choice activities.
 * The caller MUST query lesson_activities with both is_published=true and
 * activity_type=multiple_choice and verify the parent lesson is published.
 * This helper does not approve source fidelity or modify stored content.
 */
export function questionsFromPublishedActivities(
  rows: PublishedMultipleChoiceActivity[],
): QuestionRow[] {
  const accepted: QuestionRow[] = [];
  const prompts = new Set<string>();
  for (const row of rows) {
    const body = objectValue(row.content);
    const answer = objectValue(row.answer);
    const prompt = typeof row.prompt === "string" ? row.prompt.trim() : "";
    const options = body?.options;
    const correct = answer?.correct;
    if (!body || !answer || prompt.length < 9 || prompt.length > 500 ||
        !Array.isArray(options) || options.length < 2 || options.length > 5 ||
        typeof correct !== "string" || correct.trim().length === 0) continue;

    // Explicit editorial or OCR review gates always override publication.
    if (body.reviewStatus === "required" || body.reviewStatus === "pending" ||
        body.ocrReview === "pending" || body.ocrReview === "required" ||
        body.sourceVerification === "pending" || body.sourceVerification === "required" ||
        body.requiresOCRTitleReview === true) continue;

    if (!options.every(option =>
      typeof option === "string" && option.trim().length > 0 &&
      option.trim().length <= 120)) continue;

    const choices = (options as string[]).map(option => option.trim());
    const answerText = correct.trim();
    if (new Set(choices).size !== choices.length ||
        choices.filter(option => option === answerText).length !== 1) continue;

    const key = prompt.replace(/\s+/gu, " ");
    if (prompts.has(key)) continue;
    prompts.add(key);
    accepted.push({ question: prompt, options: choices, correct_answer: answerText });
  }
  return accepted;
}
