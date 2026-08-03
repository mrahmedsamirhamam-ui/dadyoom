export type StudentSkill = {
  name: string;
  score: number;
  attempts: number;
  correctAttempts: number;
};

export type StudentMistake = {
  category: string;
  count: number;
};

export type LatestAssessment = {
  score: number;
  correct: boolean;
  feedback: string;
  teacherComment: string;
  recommendation: string;
  skill: string;
  createdAt: string | null;
};

export type JourneyLessonData = {
  id: string;
  title: string;
  description: string;
  points: number;
  order: number;
  completed: boolean;
};

export type ContinueLessonData = {
  id: string;
  title: string;
  description: string;
  points: number;
  order: number;
};

export type DashboardAiRecommendation = {
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  lessonId: string | null;
  createdAt: string | null;
};

export type DashboardLearningPlan = {
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  focus_skill: string | null;
  recommended_lesson: string | null;
  practice_type: "lesson" | "quiz" | "reading" | null;
  daily_goal: string | null;
  motivation: string | null;
};

export type StudentDashboardData = {
  studentName: string;
  completedLessons: number;
  totalLessons: number;
  progress: number;
  points: number;
  badges: number;
  streakDays: number;
  overallScore: number;
  skills: StudentSkill[];
  mistakes: StudentMistake[];
  latestAssessment: LatestAssessment | null;
  journeyLessons: JourneyLessonData[];
  continueLesson: ContinueLessonData | null;
  aiMessage: string;
  aiRecommendation: DashboardAiRecommendation | null;
  learningPlan: DashboardLearningPlan | null;
};
