/**
 * Authoritative MCQ assessment is calculated on the server against stored
 * answer keys. Never accept is_correct or user_id from the browser.
 */
export type StoredMcq = {
  question_type: string;
  options: unknown;
  correct_answer: string;
};

export type GradeResult =
  | { valid: true; isCorrect: boolean; correctAnswer: string }
  | { valid: false; reason: "unsupported" | "invalid-options" | "invalid-selection" };

export function gradeStoredMcq(
  record: StoredMcq,
  selectedAnswer: unknown
): GradeResult {
  if (record.question_type !== "multiple_choice") {
    return { valid: false, reason: "unsupported" };
  }
  if (!Array.isArray(record.options) || record.options.length < 2) {
    return { valid: false, reason: "invalid-options" };
  }

  const ids: string[] = [];
  for (const option of record.options) {
    if (
      typeof option !== "object" ||
      option === null ||
      Array.isArray(option) ||
      !("id" in option) ||
      typeof option.id !== "string" ||
      !option.id.trim()
    ) {
      return { valid: false, reason: "invalid-options" };
    }
    ids.push(option.id);
  }

  if (new Set(ids).size !== ids.length || !ids.includes(record.correct_answer)) {
    return { valid: false, reason: "invalid-options" };
  }

  if (typeof selectedAnswer !== "string" || !ids.includes(selectedAnswer)) {
    return { valid: false, reason: "invalid-selection" };
  }

  return {
    valid: true,
    isCorrect: selectedAnswer === record.correct_answer,
    correctAnswer: record.correct_answer,
  };
}
