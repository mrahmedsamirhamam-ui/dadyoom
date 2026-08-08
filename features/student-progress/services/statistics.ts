import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient =
  Awaited<ReturnType<typeof createClient>>;
import { calculateLevel } from "./level";
import { calculateBadges } from "./badges";
import { calculateAchievements } from "./achievements";

export async function getStudentStatistics(
  studentId: string,
  supabaseClient?: ServerSupabaseClient
) {
  const supabase =
    supabaseClient ??
    (await createClient());

  const { data } = await supabase
    .from("student_lesson_progress")
    .select(`
      xp,
      status
    `)
    .eq("student_id", studentId);

  const rows = data ?? [];

  const totalXP = rows.reduce(
    (sum, row) => sum + (row.xp ?? 0),
    0
  );

  const completed = rows.filter(
    (row) =>
      row.status === "completed" ||
      row.status === "mastered"
  ).length;

  const mastered = rows.filter(
    (row) => row.status === "mastered"
  ).length;

  const lessons = rows.length;

  const level = calculateLevel(totalXP);

  const badges = calculateBadges({
    totalXP,
    completed,
    mastered,
  });

  const achievements = calculateAchievements({
    lessons,
    completed,
    mastered,
    totalXP,
  });

  return {
    totalXP,
    completed,
    mastered,
    lessons,
    level,
    badges,
    achievements,
  };
}