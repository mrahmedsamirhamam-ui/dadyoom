import type { SupabaseClient } from "@supabase/supabase-js";

export async function addXP(
  supabase: SupabaseClient,
  studentEmail: string,
  points: number
) {
  const { error } = await supabase.rpc(
    "increment_student_points",
    {
      p_student_email: studentEmail,
      p_points: points,
    }
  );

  if (error) {
    throw error;
  }

  return points;
}