export type LessonStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "mastered";

export interface StudentLessonProgress {
  id: string;

  studentId: string;

  lessonId: string;

  status: LessonStatus;

  progressPercent: number;

  attempts: number;

  bestScore: number;

  lastScore: number;

  xp: number;

  timeSpentSeconds: number;

  startedAt: string | null;

  completedAt: string | null;

  updatedAt: string;
}