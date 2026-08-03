import type { SupabaseClient } from "@supabase/supabase-js";

import type { Skill } from "@/lib/constants/skills";
import { addXP } from "@/services/progress/xp.service";

export interface AwardXpParams {
  supabase: SupabaseClient;
  studentEmail: string;
  skill: Skill;
  xp: number;
  reason: string;
}

export async function awardXp({
  supabase,
  studentEmail,
  skill,
  xp,
  reason,
}: AwardXpParams): Promise<number> {
  if (!studentEmail.trim()) {
    throw new Error("Student email is required.");
  }

  if (!Number.isFinite(xp) || xp <= 0) {
    throw new Error("XP must be a positive finite number.");
  }

  const awardedXp = Math.floor(xp);

  await addXP(
    supabase,
    studentEmail,
    awardedXp
  );

  console.info("XP awarded", {
    studentEmail,
    skill,
    xp: awardedXp,
    reason,
  });

  return awardedXp;
}