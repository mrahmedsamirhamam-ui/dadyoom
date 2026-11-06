/**
 * Strict browser-payload boundary for the authoritative MCQ grading route.
 * Never accept score, userId, isCorrect, question key or hidden rubric.
 */
export type AnswerSubmission = Readonly<{
  questionId: string;
  selectedAnswer: string;
}>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseAnswerSubmission(raw: unknown): AnswerSubmission | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const data = raw as Record<string, unknown>;
  const keys = Object.keys(data);
  // Positive allowlist: a client cannot smuggle result or identity overrides.
  if (keys.length !== 2 ||
      !keys.includes("questionId") ||
      !keys.includes("selectedAnswer")) return null;
  if (typeof data.questionId !== "string" || !UUID.test(data.questionId)) {
    return null;
  }
  if (typeof data.selectedAnswer !== "string" ||
      !data.selectedAnswer.trim() ||
      data.selectedAnswer.length > 128) return null;
  return {
    questionId: data.questionId,
    selectedAnswer: data.selectedAnswer,
  };
}
