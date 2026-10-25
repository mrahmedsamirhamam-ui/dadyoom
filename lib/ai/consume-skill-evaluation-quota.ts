import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type SkillEvaluationQuotaFeature =
  | "ai_speaking_evaluate"
  | "ai_writing_evaluate";

export type SkillEvaluationQuotaResult =
  | { enforced: false; allowed: true }
  | { enforced: true; allowed: boolean; unavailable: boolean };

/**
 * Staged rollout only. Do not enable until the shadow-tested RPC is
 * deployed in a separately approved staging migration and tested with real
 * student tokens. Unlike edu_consume_feature, this RPC explicitly rejects
 * unlisted features and has fixed caps for paid AI calls on every plan.
 */
export async function consumeSkillEvaluationQuota(
  studentId: string,
  feature: SkillEvaluationQuotaFeature,
): Promise<SkillEvaluationQuotaResult> {
  if (process.env.DADYOOM_ENFORCE_AI_SKILL_QUOTA !== "enabled") {
    return { enforced: false, allowed: true };
  }

  if (!studentId) {
    return { enforced: true, allowed: false, unavailable: true };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("dadyoom_consume_ai_skill_quota", {
      p_student_id: studentId,
      p_feature: feature,
    });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row ||
        typeof row.allowed !== "boolean" ||
        !Number.isSafeInteger(row.daily_limit) ||
        !Number.isSafeInteger(row.used_count) ||
        row.daily_limit < 1 ||
        row.used_count < 0 ||
        row.used_count > row.daily_limit) {
      return { enforced: true, allowed: false, unavailable: true };
    }
    return { enforced: true, allowed: row.allowed, unavailable: false };
  } catch {
    // Never fall back to unlimited spending when enforcement is enabled.
    return { enforced: true, allowed: false, unavailable: true };
  }
}
