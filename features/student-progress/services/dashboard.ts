import { getStudentStatistics } from "./statistics";
import { getContinueLesson } from "./continue-learning";

export async function getStudentDashboard(
  studentId: string
) {
  const [stats, continueLesson] =
    await Promise.all([
      getStudentStatistics(studentId),
      getContinueLesson(studentId),
    ]);

  return {
    stats,
    continueLesson,
  };
}
