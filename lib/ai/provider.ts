export type AiPriority = "low" | "medium" | "high";

export type AiPracticeType =
  | "lesson"
  | "quiz"
  | "reading";

export interface StudentAiContext {
  studentName: string;

  totalXp: number;
  completedLessons: number;

  strongestSkill: string | null;
  strongestSkillScore: number;

  weakestSkill: string | null;
  weakestSkillScore: number;

  mostFrequentMistake: string | null;
  memorySummary?: string;
  recentFocusSkills?: string[];
}

export interface AiRecommendation {
  title: string;
  message: string;
  priority: AiPriority;
  lessonId: string | null;
}

export interface AiLearningPlan {
  title: string;
  message: string;
  priority: AiPriority;

  focusSkill: string | null;
  recommendedLesson: string | null;

  practiceType: AiPracticeType;

  dailyGoal: string | null;
  motivation: string | null;
}

export interface AIProvider {
  generateRecommendation(
    context: StudentAiContext
  ): Promise<AiRecommendation>;

  generateLearningPlan(
    context: StudentAiContext
  ): Promise<AiLearningPlan>;
}