/**
 * Shared scoring of gradable lesson activities.
 * Attendance/completion-only activities must NEVER be passed to this function.
 * Points come from the published activity definition, not a student's attempt.
 */
export type GradedActivity = {
  id: string;
  points: number | null;
};

export type GradedActivityAttempt = {
  activity_id: string;
  earned_points: number | null;
  is_correct: boolean;
  attempt_number?: number | null;
};

export type ActivityScore = {
  askedQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalPossible: number;
  totalEarned: number;
  score: number;
};

export function scoreGradedActivityAttempts(
  activities: readonly GradedActivity[],
  attempts: readonly GradedActivityAttempt[]
): ActivityScore {
  const points = new Map(
    activities.map((activity) => {
      const raw = Number(activity.points ?? 0);
      return [activity.id, Number.isFinite(raw) && raw > 0 ? raw : 0] as const;
    })
  );

  const bestByActivity = new Map<
    string,
    { earned: number; correct: boolean; attemptNumber: number }
  >();

  for (const attempt of attempts) {
    if (!points.has(attempt.activity_id)) continue;
    const maxPoints = points.get(attempt.activity_id) ?? 0;
    const raw = Number(attempt.earned_points ?? 0);
    const earned = Number.isFinite(raw)
      ? Math.min(maxPoints, Math.max(0, raw))
      : 0;
    const attemptNumber = Number(attempt.attempt_number ?? 0);
    const previous = bestByActivity.get(attempt.activity_id);

    if (
      !previous ||
      earned > previous.earned ||
      (earned === previous.earned &&
        Boolean(attempt.is_correct) &&
        !previous.correct)
    ) {
      bestByActivity.set(attempt.activity_id, {
        earned,
        correct: attempt.is_correct === true,
        attemptNumber: Number.isFinite(attemptNumber) ? attemptNumber : 0,
      });
    }
  }

  const totalPossible = [...points.values()].reduce((sum, n) => sum + n, 0);
  const totalEarned = [...bestByActivity.values()].reduce(
    (sum, attempt) => sum + attempt.earned,
    0
  );
  const correctAnswers = [...bestByActivity.values()].filter(
    (attempt) => attempt.correct
  ).length;

  return {
    askedQuestions: activities.length,
    answeredQuestions: bestByActivity.size,
    correctAnswers,
    wrongAnswers: activities.length - correctAnswers,
    totalPossible,
    totalEarned,
    score: totalPossible > 0
      ? Math.round((totalEarned / totalPossible) * 100)
      : 0,
  };
}
