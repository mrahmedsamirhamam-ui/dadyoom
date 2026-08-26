import { awardXp } from "@/services/gamification";

import { subscribeToStudentEvent } from "../dispatcher";
import { StudentEventType } from "../types";

export function registerXpListener(): () => void {
  return subscribeToStudentEvent(
    StudentEventType.ASSESSMENT_COMPLETED,
    async (event) => {
      if (
        event.xp === undefined ||
        !event.skill ||
        !event.reason
      ) {
        return;
      }

      await awardXp({
        supabase: event.supabase,
        studentEmail: event.studentEmail,
        skill: event.skill,
        xp: event.xp,
        reason: event.reason,
      });
    }
  );
}
