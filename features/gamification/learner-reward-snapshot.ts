import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  LearnerRewardSnapshot,
  SkillKey,
  SkillRewardStat,
} from "@/features/gamification/reward-engine";

export type ManualAward = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  points: number;
  createdAt: string;
};

export type LearnerRewardSnapshotBundle = {
  displayName: string;
  role: string;
  country: string;
  gradeNumber: number | null;
  stats: LearnerRewardSnapshot;
  manualAwards: ManualAward[];
  claimedRewardKeys: string[];
};

function safeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export async function getLearnerRewardSnapshot(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
): Promise<LearnerRewardSnapshotBundle> {
  const profileResult = await supabase
    .from("profiles")
    .select("full_name,role,country,grade_number")
    .eq("id", userId)
    .maybeSingle();

  if (profileResult.error || !profileResult.data) {
    throw profileResult.error ?? new Error("LEARNER_PROFILE_MISSING");
  }

  const profile = profileResult.data;
  const role = String(profile.role ?? "").trim().toLowerCase();
  const country = String(profile.country ?? "BH").trim().toUpperCase() || "BH";
  const rawGrade = Number(profile.grade_number);
  const gradeNumber =
    Number.isInteger(rawGrade) && rawGrade >= 1 && rawGrade <= 12
      ? rawGrade
      : null;

  const publishedQuery = gradeNumber
    ? supabase
        .from("lessons")
        .select(
          "id,units!inner(grades!inner(grade_number,curricula!inner(countries!inner(code))))",
          { count: "exact", head: true },
        )
        .eq("status", "published")
        .eq(
          "units.grades.grade_number",
          gradeNumber,
        )
        .eq(
          "units.grades.curricula.countries.code",
          country,
        )
    : Promise.resolve({
        data: null,
        error: null,
        count: 0,
      });

  const [
    lessonsResult,
    skillsResult,
    streakResult,
    challengeResult,
    awardsResult,
    claimsResult,
    gameResult,
    pointTransactionResult,
    canonicalResult,
    publishedResult,
  ] = await Promise.all([
    supabase
      .from("student_lesson_progress")
      .select("status,xp")
      .eq("student_id", userId),

    supabase
      .from("student_skill_progress")
      .select("skill,best_score,attempts,xp")
      .eq("user_id", userId),

    supabase
      .from("student_streaks")
      .select("current_streak,longest_streak")
      .eq("student_email", userEmail)
      .maybeSingle(),

    supabase
      .from("student_daily_challenges")
      .select("status,bonus_xp")
      .eq("user_id", userId),

    supabase
      .from("edu_rewards")
      .select("id,title,description,icon,points,created_at")
      .eq("student_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("student_achievements")
      .select("achievement_key")
      .eq("student_email", userEmail)
      .like("achievement_key", "CLAIMED_%"),

    supabase
      .from("edu_game_attempts")
      .select("xp_earned")
      .eq("student_id", userId),

    supabase
      .from("edu_point_transactions")
      .select("points")
      .eq("student_id", userId),

    supabase.rpc("edu_total_xp", {
      p_student: userId,
    }),

    publishedQuery,
  ]);

  if (lessonsResult.error) {
    throw lessonsResult.error;
  }

  for (const result of [
    skillsResult,
    streakResult,
    challengeResult,
  ]) {
    if (
      result.error &&
      result.error.code !== "42P01"
    ) {
      throw result.error;
    }
  }

  if (awardsResult.error) {
    console.warn(
      "REWARD_SNAPSHOT_MANUAL_AWARDS_WARNING",
      awardsResult.error.message,
    );
  }

  if (claimsResult.error) {
    console.warn(
      "REWARD_SNAPSHOT_CLAIMS_WARNING",
      claimsResult.error.message,
    );
  }

  const lessonRows =
    lessonsResult.data ?? [];

  const completedLessons =
    lessonRows.filter(
      row =>
        row.status === "completed" ||
        row.status === "mastered",
    ).length;

  const masteredLessons =
    lessonRows.filter(
      row =>
        row.status === "mastered",
    ).length;

  const blank = (): SkillRewardStat => ({
    bestScore: 0,
    attempts: 0,
    xp: 0,
  });

  const skills: Record<
    SkillKey,
    SkillRewardStat
  > = {
    reading: blank(),
    writing: blank(),
    listening: blank(),
    speaking: blank(),
  };

  for (const row of skillsResult.data ?? []) {
    const key =
      String(row.skill ?? "") as SkillKey;

    if (!(key in skills)) continue;

    skills[key] = {
      bestScore:
        safeNumber(row.best_score),
      attempts:
        safeNumber(row.attempts),
      xp:
        safeNumber(row.xp),
    };
  }

  const lessonXP =
    lessonRows.reduce(
      (sum, row) =>
        sum +
        safeNumber(row.xp),
      0,
    );

  const skillXP =
    (skillsResult.data ?? []).reduce(
      (sum, row) =>
        sum +
        safeNumber(row.xp),
      0,
    );

  const challengeRows =
    challengeResult.data ?? [];

  const dailyChallengeXP =
    challengeRows
      .filter(
        row =>
          row.status ===
          "completed",
      )
      .reduce(
        (sum, row) =>
          sum +
          safeNumber(
            row.bonus_xp,
          ),
        0,
      );

  const rewardRows =
    awardsResult.data ?? [];

  const rewardXP =
    rewardRows.reduce(
      (sum, row) =>
        sum +
        safeNumber(
          row.points,
        ),
      0,
    );

  const gameXP =
    gameResult.error
      ? 0
      : (
          gameResult.data ??
          []
        ).reduce(
          (sum, row) =>
            sum +
            safeNumber(
              row.xp_earned,
            ),
          0,
        );

  const pointTransactionXP =
    pointTransactionResult.error
      ? 0
      : (
          pointTransactionResult.data ??
          []
        ).reduce(
          (sum, row) =>
            sum +
            safeNumber(
              row.points,
            ),
          0,
        );

  const fallbackTotal =
    lessonXP +
    skillXP +
    dailyChallengeXP +
    rewardXP +
    gameXP +
    pointTransactionXP;

  const totalXP =
    canonicalResult.error
      ? fallbackTotal
      : safeNumber(
          canonicalResult.data,
        );

  const publishedGradeLessons =
    publishedResult.error
      ? 0
      : publishedResult.count ??
        0;

  const dailyChallengesCompleted =
    challengeRows.filter(
      row =>
        row.status ===
        "completed",
    ).length;

  return {
    displayName:
      String(profile.full_name ?? "").trim() ||
      userEmail.split("@")[0] ||
      "طالب ضاديوم",
    role,
    country,
    gradeNumber,
    stats: {
      totalXP,
      lessonXP,
      skillXP,
      dailyChallengeXP,
      rewardXP,
      gameXP,
      completedLessons,
      masteredLessons,
      currentStreak: safeNumber(streakResult.data?.current_streak),
      longestStreak: safeNumber(streakResult.data?.longest_streak),
      dailyChallengesCompleted,
      publishedGradeLessons,
      skills,
    },
    manualAwards: rewardRows.map((row) => ({
      id: String(row.id),
      title: String(row.title ?? "جائزة"),
      description: row.description ? String(row.description) : null,
      icon: String(row.icon ?? "🏆"),
      points: safeNumber(row.points),
      createdAt: String(row.created_at ?? ""),
    })),
    claimedRewardKeys: (claimsResult.data ?? []).map((row) =>
      String(row.achievement_key ?? "").replace(/^CLAIMED_/, ""),
    ),
  };
}
