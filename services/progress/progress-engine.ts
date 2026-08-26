import type { SupabaseClient } from "@supabase/supabase-js";

import type { Skill } from "@/lib/constants/skills";
import type { StudentEvent } from "@/services/events";

import { ACHIEVEMENTS } from "@/services/gamification/achievement-definitions";
import { unlockAchievement } from "@/services/gamification/achievements";
import { updateStreak } from "@/services/gamification/streak";
import { awardXp } from "@/services/gamification/xp";

import { getCompletedLessonsCount } from "./completed-lessons";
import { increaseSkill } from "./skills.service";

export type LessonProgressResult = {
  awardedXp: number;
  currentStreak: number;
  longestStreak: number;
  newlyUnlockedAchievements: string[];
};

export async function processLessonCompleted(
  event: StudentEvent
): Promise<LessonProgressResult> {
  let awardedXp = 0;
  const newlyUnlockedAchievements: string[] = [];

  if (
    event.skill &&
    event.xp !== undefined &&
    event.reason
  ) {
    awardedXp = await awardXp({
      supabase: event.supabase,
      studentEmail: event.studentEmail,
      skill: event.skill,
      xp: event.xp,
      reason: event.reason,
    });
  }

  const streak = await updateStreak({
    supabase: event.supabase,
    studentEmail: event.studentEmail,
    activityDate: event.createdAt,
  });

  const completedLessons =
    await getCompletedLessonsCount(
      event.supabase,
      event.studentEmail
    );

  if (completedLessons >= 1) {
    const firstLessonResult = await unlockAchievement({
      supabase: event.supabase,
      studentEmail: event.studentEmail,
      achievementKey: ACHIEVEMENTS.FIRST_LESSON.key,
      title: ACHIEVEMENTS.FIRST_LESSON.title,
      description:
        ACHIEVEMENTS.FIRST_LESSON.description,
      icon: ACHIEVEMENTS.FIRST_LESSON.icon,
    });

    if (firstLessonResult.newlyUnlocked) {
      newlyUnlockedAchievements.push(
        ACHIEVEMENTS.FIRST_LESSON.title
      );
    }
  }

  if (completedLessons >= 5) {
    const fiveLessonsResult = await unlockAchievement({
      supabase: event.supabase,
      studentEmail: event.studentEmail,
      achievementKey: ACHIEVEMENTS.FIVE_LESSONS.key,
      title: ACHIEVEMENTS.FIVE_LESSONS.title,
      description:
        ACHIEVEMENTS.FIVE_LESSONS.description,
      icon: ACHIEVEMENTS.FIVE_LESSONS.icon,
    });

    if (fiveLessonsResult.newlyUnlocked) {
      newlyUnlockedAchievements.push(
        ACHIEVEMENTS.FIVE_LESSONS.title
      );
    }
  }

  return {
    awardedXp,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    newlyUnlockedAchievements,
  };
}

type UpdateProgressInput = {
  studentEmail: string;
  skill: Skill;
  correct: boolean;
};

export async function updateProgress(
  supabase: SupabaseClient,
  input: UpdateProgressInput
): Promise<void> {
  if (input.correct) {
    await awardXp({
      supabase,
      studentEmail:
        input.studentEmail,
      skill:
        input.skill,
      xp: 20,
      reason:
        "Correct assessment answer",
    });
  }

  await increaseSkill(
    supabase,
    input.studentEmail,
    input.skill,
    input.correct ? 10 : -5
  );
}
