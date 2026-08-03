import { unlockAchievement } from "@/services/gamification/achievements";

import { subscribeToStudentEvent } from "../dispatcher";
import { StudentEventType } from "../types";

subscribeToStudentEvent(
  StudentEventType.LESSON_COMPLETED,
  async (event) => {
    const result = await unlockAchievement({
      supabase: event.supabase,
      studentEmail: event.studentEmail,
      achievementKey: "FIRST_LESSON",
      title: "أول خطوة",
      description: "أكملت أول درس في ضاديوم.",
      icon: "🥇",
    });

    if (result.newlyUnlocked) {
      console.info(
        "Achievement unlocked:",
        event.studentEmail,
        "FIRST_LESSON"
      );
    }
  }
);