import { logger } from "@/lib/logger";
import { updateStreak } from "@/services/gamification/streak";

import { subscribeToStudentEvent } from "../dispatcher";
import { StudentEventType } from "../types";

subscribeToStudentEvent(
  StudentEventType.LESSON_COMPLETED,
  async (event) => {
    const streak = await updateStreak({
      supabase: event.supabase,
      studentEmail: event.studentEmail,
      activityDate: event.createdAt,
    });

    logger.info("Streak updated", streak);
  }
);