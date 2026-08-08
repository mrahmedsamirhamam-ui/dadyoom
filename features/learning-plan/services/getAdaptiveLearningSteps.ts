import type { SupabaseClient } from "@supabase/supabase-js";

export async function getAdaptiveLearningSteps(
  supabase: SupabaseClient,
  studentId: string,
  lessonId?: string | null
) {
  let query = supabase
    .from("adaptive_learning_steps")
    .select("*")
    .eq("student_id", studentId)
    .order("step_order", {
      ascending: true,
    });

  if (lessonId) {
    query = query.eq("lesson_id", lessonId);
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}
