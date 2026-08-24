import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  calculateLevel,
} from "./level";

import {
  calculateBadges,
} from "./badges";

import {
  calculateAchievements,
} from "./achievements";

import {
  getUnifiedGamificationXP,
} from "./unified-gamification";

export async function getStudentStatistics(
  studentId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase =
    supabaseClient ??
    (await createClient());

  const {
    data,
    error,
  } =
    await supabase
      .from("student_lesson_progress")
      .select(`
        xp,
        status
      `)
      .eq(
        "student_id",
        studentId
      );

  if (error) {
    throw error;
  }

  const rows =
    data ?? [];

  const lessons =
    rows.length;

  const completed =
    rows.filter(
      row =>
        row.status === "completed" ||
        row.status === "mastered"
    ).length;

  const mastered =
    rows.filter(
      row =>
        row.status === "mastered"
    ).length;

  const {
    lessonXP,
    skillXP,
    totalXP,
  } =
    await getUnifiedGamificationXP(
      studentId,
      supabase
    );

  const level =
    calculateLevel(totalXP);

  const badges =
    calculateBadges({
      totalXP,
      completed,
      mastered,
    });

  const achievements =
    calculateAchievements({
      lessons,
      completed,
      mastered,
      totalXP,
    });

  return {
    totalXP,

    lessonXP,

    skillXP,

    lessons,

    completed,

    mastered,

    level,

    badges,

    achievements,
  };
}
