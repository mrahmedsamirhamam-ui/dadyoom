import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient =
  Awaited<ReturnType<typeof createClient>>;
import { calculateLevel } from "@/features/student-progress/services/level";
import { updateLearningProfile } from "./update-profile";

export async function syncLearningProfile(
  studentId: string,
  supabaseClient?: ServerSupabaseClient
) {
  const supabase =
    supabaseClient ??
    (await createClient());

  const { data, error } = await supabase
    .from("student_lesson_progress")
    .select(`
      status,
      best_score,
      xp
    `)
    .eq("student_id", studentId);

  if (error) {
    throw error;
  }

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

  const scoredRows = rows.filter(
    (row) =>
      typeof row.best_score === "number" &&
      row.best_score > 0
  );

  const averageScore =
    scoredRows.length > 0
      ? scoredRows.reduce(
          (sum, row) =>
            sum + (row.best_score ?? 0),
          0
        ) / scoredRows.length
      : 0;

  const level = calculateLevel(totalXP);

  await updateLearningProfile({
    studentId,
    level: level.level,
    xp: totalXP,
    completed,
    mastered,
    averageScore: Number(
      averageScore.toFixed(2)
    ),
  });

  return {
    currentLevel: level.level,
    totalXP,
    completed,
    mastered,
    averageScore,
  };
}
