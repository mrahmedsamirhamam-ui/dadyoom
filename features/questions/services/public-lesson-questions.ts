/**
 * Public lesson/question payload allowlist.
 *
 * Never forward the full question database row to a student-facing component
 * or serialized lesson bundle. In particular, do not include correct_answer,
 * explanation, unpublished metadata or new answer-related columns.
 */
export type StudentQuestion = {
  id: string;
  lesson_id: string;
  question_order: number;
  question: string;
  question_type: string;
  options: { id: string; text: string }[];
  points: number;
};

const object = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export function publicLessonQuestions(input: unknown): StudentQuestion[] {
  if (!Array.isArray(input)) return [];
  const output: StudentQuestion[] = [];

  for (const item of input) {
    const row = object(item);
    if (!row ||
        typeof row.id !== "string" ||
        typeof row.lesson_id !== "string" ||
        typeof row.question !== "string" ||
        typeof row.question_type !== "string") continue;

    output.push({
      id: row.id,
      lesson_id: row.lesson_id,
      question_order:
        typeof row.question_order === "number" && Number.isFinite(row.question_order)
          ? row.question_order
          : 0,
      question: row.question,
      question_type: row.question_type,
      // An option may contain grading flags in later schemas.
      // Never return arbitrary nested fields to student clients.
      options: Array.isArray(row.options)
        ? row.options.flatMap((candidate: unknown) => {
            const option = object(candidate);
            if (!option ||
                typeof option.id !== "string" ||
                typeof option.text !== "string") return [];
            return [{ id: option.id, text: option.text }];
          })
        : [],
      points: typeof row.points === "number" && Number.isFinite(row.points)
        ? row.points : 0,
    });
  }

  return output;
}
