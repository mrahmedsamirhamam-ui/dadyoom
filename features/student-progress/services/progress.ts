import {
  createLessonProgress,
  getLessonProgress,
  updateLessonProgress,
} from "../repositories/progress.repository";

import { calculateXP } from "./xp";
import { calculateMastery } from "./mastery";

export async function startLesson(
  studentId: string,
  lessonId: string
) {
  const existing = await getLessonProgress(
    studentId,
    lessonId
  );

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    return existing.data;
  }

  const created = await createLessonProgress({
    student_id: studentId,
    lesson_id: lessonId,
  });

  if (created.error) {
    throw created.error;
  }

  return created.data;
}

export async function completeLesson(
  progressId: string,
  score: number,
  previousBestScore: number = 0
) {
  const bestScore = Math.max(
    score,
    previousBestScore
  );

  const result = await updateLessonProgress(
    progressId,
    {
      status: calculateMastery(score),
      progress_percent: 100,
      last_score: score,
      best_score: bestScore,
      xp: calculateXP(score),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );

  if (result.error) {
    throw result.error;
  }

  return result.data;
}
