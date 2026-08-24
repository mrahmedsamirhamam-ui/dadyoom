import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  unlockAchievement,
} from "@/services/gamification/achievements";

import {
  updateStreak,
} from "@/services/gamification/streak";

export type DailyChallengeSkill =
  | "reading"
  | "writing"
  | "listening"
  | "speaking";

export type DailyChallengeCompletionResult = {
  matched: boolean;
  completed: boolean;
  newlyCompleted: boolean;
  targetScore: number | null;
  achievedScore: number;
  bonusXp: number;
};

const DAILY_CHALLENGE_BONUS_XP =
  15;

export function getBahrainDate(
  date = new Date()
): string {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Bahrain",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    )
      .formatToParts(
        date
      );

  const year =
    parts.find(
      part =>
        part.type === "year"
    )?.value;

  const month =
    parts.find(
      part =>
        part.type === "month"
    )?.value;

  const day =
    parts.find(
      part =>
        part.type === "day"
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    return date
      .toISOString()
      .slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

export async function completeDailyChallengeFromSkillResult(
  params: {
    supabase: SupabaseClient;
    userId: string;
    userEmail?: string | null;
    skill: DailyChallengeSkill;
    score: number;
  }
): Promise<DailyChallengeCompletionResult> {

  const {
    supabase,
    userId,
    userEmail,
    skill,
  } =
    params;

  const score =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Number(
            params.score
          ) || 0
        )
      )
    );

  const today =
    getBahrainDate();

  const {
    data: challenge,
    error: loadError,
  } =
    await supabase
      .from(
        "student_daily_challenges"
      )
      .select(`
        id,
        skill,
        target_score,
        status,
        bonus_awarded,
        bonus_xp
      `)
      .eq(
        "user_id",
        userId
      )
      .eq(
        "challenge_date",
        today
      )
      .maybeSingle();

  if (loadError) {
    if (
      loadError.code ===
      "42P01"
    ) {
      return {
        matched: false,
        completed: false,
        newlyCompleted: false,
        targetScore: null,
        achievedScore:
          score,
        bonusXp: 0,
      };
    }

    throw loadError;
  }

  if (
    !challenge ||
    challenge.skill !== skill
  ) {
    return {
      matched: false,
      completed: false,
      newlyCompleted: false,
      targetScore:
        challenge?.target_score ??
        null,
      achievedScore:
        score,
      bonusXp:
        Number(
          challenge?.bonus_xp ??
          0
        ),
    };
  }

  const targetScore =
    Number(
      challenge.target_score ??
      0
    );

  if (
    challenge.status ===
      "completed" ||
    challenge.bonus_awarded
  ) {
    return {
      matched: true,
      completed: true,
      newlyCompleted: false,
      targetScore,
      achievedScore:
        score,
      bonusXp:
        Number(
          challenge.bonus_xp ??
          0
        ),
    };
  }

  if (
    score <
    targetScore
  ) {
    const {
      error: scoreError,
    } =
      await supabase
        .from(
          "student_daily_challenges"
        )
        .update({
          achieved_score:
            score,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          challenge.id
        );

    if (scoreError) {
      throw scoreError;
    }

    return {
      matched: true,
      completed: false,
      newlyCompleted: false,
      targetScore,
      achievedScore:
        score,
      bonusXp: 0,
    };
  }

  const now =
    new Date();

  const {
    data: claimed,
    error: claimError,
  } =
    await supabase
      .from(
        "student_daily_challenges"
      )
      .update({
        status:
          "completed",

        achieved_score:
          score,

        completed_at:
          now.toISOString(),

        bonus_xp:
          DAILY_CHALLENGE_BONUS_XP,

        bonus_awarded:
          true,

        updated_at:
          now.toISOString(),
      })
      .eq(
        "id",
        challenge.id
      )
      .eq(
        "bonus_awarded",
        false
      )
      .select(`
        id,
        bonus_xp
      `)
      .maybeSingle();

  if (claimError) {
    throw claimError;
  }

  if (!claimed) {
    return {
      matched: true,
      completed: true,
      newlyCompleted: false,
      targetScore,
      achievedScore:
        score,
      bonusXp:
        DAILY_CHALLENGE_BONUS_XP,
    };
  }

  if (
    userEmail?.trim()
  ) {

    try {
      await updateStreak({
        supabase,

        studentEmail:
          userEmail.trim(),

        activityDate:
          now,
      });
    }
    catch (error) {
      console.warn(
        "DAILY_CHALLENGE_STREAK_FAILED:",
        error
      );
    }

    try {
      await unlockAchievement({
        supabase,

        studentEmail:
          userEmail.trim(),

        achievementKey:
          "DAILY_CHALLENGE_FIRST",

        title:
          "بطل التحدي اليومي",

        description:
          "أكملت أول تحدٍ يومي في ضاديوم.",

        icon:
          "🏆",
      });
    }
    catch (error) {
      console.warn(
        "DAILY_CHALLENGE_ACHIEVEMENT_FAILED:",
        error
      );
    }
  }

  return {
    matched: true,
    completed: true,
    newlyCompleted: true,
    targetScore,
    achievedScore:
      score,
    bonusXp:
      DAILY_CHALLENGE_BONUS_XP,
  };
}
