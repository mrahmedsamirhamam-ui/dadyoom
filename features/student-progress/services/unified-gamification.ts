import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  createClient,
} from "@/lib/supabase/server";

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

  const [
    lessonResult,
    skillResult,
    challengeResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "student_lesson_progress"
        )
        .select("xp")
        .eq(
          "student_id",
          studentId
        ),

      supabase
        .from(
          "student_skill_progress"
        )
        .select("xp")
        .eq(
          "user_id",
          studentId
        ),

      supabase
        .from(
          "student_daily_challenges"
        )
        .select(
          "bonus_xp,bonus_awarded"
        )
        .eq(
          "user_id",
          studentId
        )
        .eq(
          "bonus_awarded",
          true
        ),
    ]);

  if (
    lessonResult.error
  ) {
    throw lessonResult.error;
  }

  if (
    skillResult.error &&
    skillResult.error.code !==
      "42P01"
  ) {
    throw skillResult.error;
  }

  if (
    challengeResult.error &&
    challengeResult.error.code !==
      "42P01"
  ) {
    throw challengeResult.error;
  }

  const lessonXP =
    (
      lessonResult.data ??
      []
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
      skillResult.data ??
      []
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
      challengeResult.data ??
      []
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
