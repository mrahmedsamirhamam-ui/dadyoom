import {
  getAdaptiveLessonData,
  type AdaptiveLessonDataOptions,
} from "../queries/getAdaptiveLessonData";

import {
  evaluatePerformance,
} from "./evaluatePerformance";

export async function getAdaptiveRecommendation(
  userId: string,
  lessonId: string,
  options: AdaptiveLessonDataOptions = {}
) {
  const data =
    await getAdaptiveLessonData(
      userId,
      lessonId,
      options
    );

  if (!data) {
    return null;
  }

  const totalQuestions =
    data.attempts.length;

  const correctAnswers =
    data.attempts.filter(
      (attempt) =>
        attempt.is_correct
    ).length;

  const score =
    totalQuestions > 0
      ? Math.round(
          (correctAnswers /
            totalQuestions) *
            100
        )
      : 0;

  return evaluatePerformance({
    score,
    attempts: data.attempts,
    currentLessonId: lessonId,
    nextLessonId:
      data.nextLesson?.id ?? null,
  });
}
