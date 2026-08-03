import { ACHIEVEMENTS } from "@/services/gamification/achievement-definitions";
import { unlockAchievement } from "@/services/gamification/achievements";
import { getCompletedLessonsCount } from "@/services/progress/completed-lessons";

import { subscribeToStudentEvent } from "../dispatcher";
import { StudentEventType } from "../types";

subscribeToStudentEvent(
  StudentEventType.LESSON_COMPLETED,
  async (event) => {
    const completedLessons =
      await getCompletedLessonsCount(
        event.supabase,
        event.studentEmail
      );

    if (completedLessons < 5) {
      return;
    }

    await unlockAchievement({
      supabase: event.supabase,
      studentEmail: event.studentEmail,
      achievementKey: ACHIEVEMENTS.FIVE_LESSONS.key,
      title: ACHIEVEMENTS.FIVE_LESSONS.title,
      description: ACHIEVEMENTS.FIVE_LESSONS.description,
      icon: ACHIEVEMENTS.FIVE_LESSONS.icon,
    });
  }
);