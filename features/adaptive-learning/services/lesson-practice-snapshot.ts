type QuestionAttempt = { question_id: string; is_correct: boolean };
type ActivityAttempt = { activity_id: string; is_correct: boolean };
type PracticeAttempt = { question_id: string; is_correct: boolean };

/** Snapshot of UNIQUE practice items, including unanswered questions.
 * A participation-only activity can help review but NEVER certifies mastery. */
export function buildLessonPracticeSnapshot({
  questionIds,
  activityIds,
  questionAttempts,
  activityAttempts,
}: {
  questionIds: string[];
  activityIds: string[];
  questionAttempts: QuestionAttempt[];
  activityAttempts: ActivityAttempt[];
}): {
  attempts: PracticeAttempt[];
  correctCount: number;
  totalItems: number;
  score: number;
  correctQuestionCount: number;
  wrongQuestionIds: string[];
} {
  const answeredQuestions = new Set(
    questionAttempts.filter(a => a.is_correct).map(a => a.question_id)
  );
  const answeredActivities = new Set(
    activityAttempts.filter(a => a.is_correct).map(a => a.activity_id)
  );
  // Stored attempts might contain stale IDs or multiple retries; only
  // published items belonging to this lesson count, once per ID.
  const uniqueQuestions = [...new Set(questionIds)];
  const uniqueActivities = [...new Set(activityIds)];
  const attempts: PracticeAttempt[] = [
    ...uniqueQuestions.map(id => ({
      question_id: id,
      is_correct: answeredQuestions.has(id),
    })),
    ...uniqueActivities.map(id => ({
      question_id: id,
      is_correct: answeredActivities.has(id),
    })),
  ];
  const correctCount = attempts.filter(a => a.is_correct).length;
  const totalItems = attempts.length;
  return {
    attempts,
    correctCount,
    totalItems,
    score: totalItems ? Math.round(correctCount / totalItems * 100) : 0,
    correctQuestionCount: uniqueQuestions.filter(id => answeredQuestions.has(id)).length,
    wrongQuestionIds: uniqueQuestions.filter(id => !answeredQuestions.has(id) &&
      questionAttempts.some(a => a.question_id === id)),
  };
}
