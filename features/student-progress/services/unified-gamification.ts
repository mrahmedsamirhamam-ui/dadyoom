import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  createClient,
} from "@/lib/supabase/server";
import { readCompleteGradingPages } from "@/lib/lesson-activities/read-complete-pages";

export type UnifiedGamificationXP = {
  lessonXP: number;
  skillXP: number;
  dailyChallengeXP: number;
  totalXP: number;
};

function safeNumber(
  value: unknown
): number {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? Math.max(
        0,
        number
      )
    : 0;
}

export async function getUnifiedGamificationXP(
  studentId: string,
  supabaseClient?: SupabaseClient
): Promise<UnifiedGamificationXP> {

  const supabase =
    supabaseClient ??
    (await createClient());


  // Every collection is owner-scoped and read with a stable primary-key
  // order. PostgREST may cap a query below its requested limit: using only
  // its first page silently understates XP, achievements and current level.
  // Use exact counts and refuse drifting or truncated snapshots.
  const [lessonRows, skillRows, challengeRows] = await Promise.all([
    readCompleteGradingPages({
      readPage: async (offset, limit) => {
        const { data, count, error } = await supabase
          .from("student_lesson_progress")
          .select("id,xp", { count: "exact" })
          .eq("student_id", studentId)
          .order("id", { ascending: true })
          .range(offset, offset + limit - 1);
        return { data, count, error };
      },
    }),
    readCompleteGradingPages({
      readPage: async (offset, limit) => {
        const { data, count, error } = await supabase
          .from("student_skill_progress")
          .select("id,xp", { count: "exact" })
          .eq("user_id", studentId)
          .order("id", { ascending: true })
          .range(offset, offset + limit - 1);
        // Preserve existing legacy support when this optional table has
        // not been migrated. Never suppress an RLS/permission failure.
        if (error?.code === "42P01") {
          return { data: [], count: 0, error: null };
        }
        return { data, count, error };
      },
    }),
    readCompleteGradingPages({
      readPage: async (offset, limit) => {
        const { data, count, error } = await supabase
          .from("student_daily_challenges")
          .select("id,bonus_xp", { count: "exact" })
          .eq("user_id", studentId)
          .eq("bonus_awarded", true)
          .order("id", { ascending: true })
          .range(offset, offset + limit - 1);
        if (error?.code === "42P01") {
          return { data: [], count: 0, error: null };
        }
        return { data, count, error };
      },
    }),
  ]);

  const lessonXP =
    (
      lessonRows
    ).reduce(
      (
        total,
        row
      ) =>
        total +
        safeNumber(
          row.xp
        ),
      0
    );

  const skillXP =
    (
      skillRows
    ).reduce(
      (
        total,
        row
      ) =>
        total +
        safeNumber(
          row.xp
        ),
      0
    );

  const dailyChallengeXP =
    (
      challengeRows
    ).reduce(
      (
        total,
        row
      ) =>
        total +
        safeNumber(
          row.bonus_xp
        ),
      0
    );

  return {
    lessonXP,
    skillXP,
    dailyChallengeXP,

    totalXP:
      lessonXP +
      skillXP +
      dailyChallengeXP,
  };
}
