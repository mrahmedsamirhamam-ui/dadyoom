/**
 * Return all new, distinct reviewed questions without discarding question #4+.
 * Never replace existing student-facing question rows or their attempt IDs.
 */
export function buildMissingCurriculumQuestions(lessonId, packQuestions, storedRows) {
  if (typeof lessonId !== "string" || !lessonId ||
      !Array.isArray(packQuestions) || !Array.isArray(storedRows) ||
      packQuestions.length > 40) {
    throw new Error("CURRICULUM_QUESTIONS_INVALID");
  }
  const seen = new Set(
    storedRows.map((q) => String(q.question ?? "").trim()).filter(Boolean),
  );
  const next = storedRows.reduce((n, q) =>
    Math.max(n, Number.isFinite(Number(q.question_order)) ? Number(q.question_order) : 0), 0,
  );
  let order = next + 1;
  const rows = [];
  for (const q of packQuestions) {
    const prompt = typeof q?.question === "string" ? q.question.trim() : "";
    if (!prompt) throw new Error("CURRICULUM_QUESTION_MISSING_TEXT");
    if (seen.has(prompt)) continue;
    seen.add(prompt);
    rows.push({
      lesson_id: lessonId,
      question_order: order++,
      question: prompt,
      question_type: q.type,
      options: q.options,
      correct_answer: q.correctAnswer,
      explanation: q.explanation ?? null,
      points: q.points ?? 1,
    });
  }
  return rows;
}
