import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Adjust a learner's score when a trusted server-side grading workflow calls
 * this service. The table has UNIQUE(student_email, skill), confirmed against
 * the live schema read-only. Newly assessed skills must be created rather
 * than silently skipping a zero-row UPDATE.
 *
 * A transaction-level increment RPC will ultimately be required for
 * concurrent scoring; this read-then-upsert is not an atomic increment.
 */
export async function increaseSkill(
  supabase: SupabaseClient,
  studentEmail: string,
  skill: string,
  value = 3
): Promise<void> {
  const email = studentEmail.trim();
  const skillName = skill.trim();
  if (!email || !skillName || !Number.isFinite(value)) {
    throw new Error("Invalid student skill update.");
  }

  const { data, error: readError } = await supabase
    .from("student_skills")
    .select("score")
    .eq("student_email", email)
    .eq("skill", skillName)
    .maybeSingle();

  if (readError) throw readError;

  const previous = data?.score ?? 0;
  if (typeof previous !== "number" || !Number.isFinite(previous)) {
    throw new Error("Stored student skill score is invalid.");
  }

  const score = Math.max(0, Math.min(100, Math.round(previous + value)));
  const { error: writeError } = await supabase
    .from("student_skills")
    .upsert(
      { student_email: email, skill: skillName, score },
      { onConflict: "student_email,skill" }
    );

  if (writeError) throw writeError;
}
