import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  recommendAdaptiveSkill,
  type AdaptiveSkill,
  type SkillProgressInput,
} from "@/features/adaptive-skills/adaptive-skill-engine";
import { createDailyChallenge } from "@/features/gamification/daily-challenge";
import { readCompleteGradingPages } from "@/lib/lesson-activities/read-complete-pages";

const VALID_SKILLS = new Set<AdaptiveSkill>([
  "reading", "writing", "listening", "speaking",
]);

/**
 * Recreate the recommended daily challenge from owner-scoped database data.
 * POST callers may submit a challenge ID, but must NEVER control skill,
 * title, target score or XP by editing their JSON request.
 *
 * This guards the HTTP boundary; the authenticated DB grant cutover is still
 * required because skill progress and challenge rows remain owner-writable.
 */
export async function resolveTrustedDailyChallenge(
  supabase: SupabaseClient,
  studentId: string,
) {
  const rows = await readCompleteGradingPages({
    readPage: async (offset, limit) => {
      const { data, count, error } = await supabase
        .from("student_skill_progress")
        .select("id,skill,latest_score,best_score,attempts,xp,level", { count: "exact" })
        .eq("user_id", studentId)
        .order("id", { ascending: true })
        .range(offset, offset + limit - 1);
      return { data, count, error };
    },
  });

  const progress: SkillProgressInput[] = rows.flatMap((row) => {
    if (typeof row.skill !== "string" ||
      !VALID_SKILLS.has(row.skill as AdaptiveSkill)) return [];
    return [{
      skill: row.skill as AdaptiveSkill,
      latest_score: Number(row.latest_score ?? 0),
      best_score: Number(row.best_score ?? 0),
      attempts: Number(row.attempts ?? 0),
      xp: Number(row.xp ?? 0),
      level: typeof row.level === "string" ? row.level : "مبتدئ",
    }];
  });
  const recommendation = recommendAdaptiveSkill(progress);
  return createDailyChallenge({
    skill: recommendation.skill,
    skillLabel: recommendation.skillLabel,
    href: recommendation.href,
    targetScore: recommendation.targetScore,
  });
}
