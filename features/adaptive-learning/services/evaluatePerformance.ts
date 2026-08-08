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
};

function getDecision(
  score: number
): AdaptiveDecision {
  if (score >= 90) {
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
}: Input): AdaptiveRecommendation {
  const decision = getDecision(score);

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
        "أداء جيد. راجع إجاباتك الخاطئة ثم انتقل إلى الدرس التالي.",
      recommendedLessonId: nextLessonId,
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