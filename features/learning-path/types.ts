export type LearningPath = {
  currentLessonId: string;
  nextLessonId: string | null;
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
};

export type Recommendation = {
  lessonId: string;
  reason: string;
  priority: number;
};
