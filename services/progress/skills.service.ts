import type { SupabaseClient } from "@supabase/supabase-js";

export async function increaseSkill(
  supabase: SupabaseClient,
  studentEmail: string,
  skill: string,
  value = 3
) {
  const { data } = await supabase
    .from("student_skills")
    .select("score")
    .eq("student_email", studentEmail)
    .eq("skill", skill)
    .single();

  const current = data?.score ?? 0;

  await supabase
    .from("student_skills")
    .update({
      score: Math.min(current + value, 100),
    })
    .eq("student_email", studentEmail)
    .eq("skill", skill);
}
