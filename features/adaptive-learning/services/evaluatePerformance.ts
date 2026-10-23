import type {
  AdaptiveDecision,
  AdaptiveRecommendation,
} from "../types/adaptive";

type QuestionAttempt = {
  question_id: string;
  is_correct: boolean;
};

type Input = {
  score: number;
  attempts: QuestionAttempt[];
  currentLessonId: string;
  nextLessonId: string | null;
  /** True only when server-graded lesson completion is already recorded. */
  masteryVerified?: boolean;
};

function getDecision(
  score: number,
  masteryVerified: boolean
): AdaptiveDecision {
  if (masteryVerified && score >= 90) {
    return "mastered";
  }

  if (score >= 70) {
    return "continue";
  }

  if (score >= 50) {
    return "review";
  }

  return "retry";
}

export function evaluatePerformance({
  score,
  attempts,
  currentLessonId,
  nextLessonId,
  masteryVerified = false,
}: Input): AdaptiveRecommendation {
  const decision = getDecision(score, masteryVerified);

  const weakQuestionIds = attempts
    .filter((attempt) => !attempt.is_correct)
    .map((attempt) => attempt.question_id);

  if (decision === "mastered") {
    return {
      decision,
      score,
      message:
        "أحسنت! أتقنت الدرس ويمكنك الانتقال إلى الدرس التالي.",
      recommendedLessonId: nextLessonId,
      weakQuestionIds,
    };
  }

  if (decision === "continue") {
    return {
      decision,
      score,
      message:
        "أداء تدريبي جيد. راجع المحاولات غير الصحيحة واجتز تقييم الإتقان قبل الانتقال.",
      recommendedLessonId: currentLessonId,
      weakQuestionIds,
    };
  }

  if (decision === "review") {
    return {
      decision,
      score,
      message:
        "تحتاج إلى مراجعة بعض أجزاء الدرس قبل الانتقال.",
      recommendedLessonId: currentLessonId,
      weakQuestionIds,
    };
  }

  return {
    decision,
    score,
    message:
      "أعد قراءة الدرس ثم حاول الإجابة عن الأسئلة مرة أخرى.",
    recommendedLessonId: currentLessonId,
    weakQuestionIds,
  };
}
