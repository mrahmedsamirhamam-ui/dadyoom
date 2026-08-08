export type AdaptiveDecision =
  | "continue"
  | "review"
  | "retry"
  | "mastered";

export type AdaptiveRecommendation = {
  decision: AdaptiveDecision;
  score: number;
  message: string;
  recommendedLessonId: string | null;
  weakQuestionIds: string[];
};