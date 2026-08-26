import { awardXp } from "@/services/gamification/xp";
import { subscribeToStudentEvent } from "../dispatcher";
import { StudentEventType } from "../types";

subscribeToStudentEvent(
  StudentEventType.LESSON_COMPLETED,
  async (event) => {
    // التحقق من وجود البيانات المطلوبة قبل إضافة النقاط
    if (!event.skill || !event.xp || !event.reason) {
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
