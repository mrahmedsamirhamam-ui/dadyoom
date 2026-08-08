import { getLearningProfile } from "@/features/learning-profile/services/profile";
import { getStudentStatistics } from "@/features/student-progress/services/statistics";
import { getContinueLesson } from "@/features/student-progress/services/continue-learning";
import { getRecommendedLessons } from "@/features/student-progress/services/recommendations";

export async function buildLearningState(
  studentId: string
) {
  const [
    profile,
    statistics,
    continueLesson,
    recommendations,
  ] = await Promise.all([
    getLearningProfile(studentId),
    getStudentStatistics(studentId),
    getContinueLesson(studentId),
    getRecommendedLessons(studentId),
  ]);

  return {
    profile,
    statistics,
    continueLesson,
    recommendations,
  };
}