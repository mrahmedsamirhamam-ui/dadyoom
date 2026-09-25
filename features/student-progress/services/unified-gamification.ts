import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export type UnifiedGamificationXP = {
  lessonXP: number;
  skillXP: number;
  dailyChallengeXP: number;
  rewardXP: number;
  gameXP: number;
  pointTransactionXP: number;
  totalXP: number;
};

function safeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function sum(rows: Array<Record<string, unknown>>, key: string) {
  return rows.reduce((total, row) => total + safeNumber(row[key]), 0);
}

export async function getUnifiedGamificationXP(
  studentId: string,
  supabaseClient?: SupabaseClient,
): Promise<UnifiedGamificationXP> {
  const supabase = supabaseClient ?? (await createClient());

  const [
    lessonResult,
    skillResult,
    challengeResult,
    rewardResult,
    gameResult,
    pointTransactionResult,
    canonicalResult,
  ] = await Promise.all([
    supabase.from("student_lesson_progress").select("xp").eq("student_id", studentId),
    supabase.from("student_skill_progress").select("xp").eq("user_id", studentId),
    supabase
      .from("student_daily_challenges")
      .select("bonus_xp")
      .eq("user_id", studentId)
      .eq("bonus_awarded", true),
    supabase.from("edu_rewards").select("points").eq("student_id", studentId),
    supabase.from("edu_game_attempts").select("xp_earned").eq("student_id", studentId),
    supabase.from("edu_point_transactions").select("points").eq("student_id", studentId),
    supabase.rpc("edu_total_xp", { p_student: studentId }),
  ]);

  if (lessonResult.error) throw lessonResult.error;
  if (skillResult.error && skillResult.error.code !== "42P01") throw skillResult.error;
  if (challengeResult.error && challengeResult.error.code !== "42P01") throw challengeResult.error;

  const lessonXP = sum((lessonResult.data ?? []) as Array<Record<string, unknown>>, "xp");
  const skillXP = sum((skillResult.data ?? []) as Array<Record<string, unknown>>, "xp");
  const dailyChallengeXP = sum((challengeResult.data ?? []) as Array<Record<string, unknown>>, "bonus_xp");
  const rewardXP = rewardResult.error ? 0 : sum((rewardResult.data ?? []) as Array<Record<string, unknown>>, "points");
  const gameXP = gameResult.error ? 0 : sum((gameResult.data ?? []) as Array<Record<string, unknown>>, "xp_earned");
  const pointTransactionXP = pointTransactionResult.error
    ? 0
    : sum(
        (pointTransactionResult.data ?? []) as Array<Record<string, unknown>>,
        "points",
      );

  const fallbackTotal =
    lessonXP +
    skillXP +
    dailyChallengeXP +
    rewardXP +
    gameXP +
    pointTransactionXP;
  const totalXP = canonicalResult.error ? fallbackTotal : safeNumber(canonicalResult.data);

  return {
    lessonXP,
    skillXP,
    dailyChallengeXP,
    rewardXP,
    gameXP,
    pointTransactionXP,
    totalXP,
  };
}
