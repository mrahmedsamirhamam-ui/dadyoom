import type { SupabaseClient } from "@supabase/supabase-js";

export async function getCompletedLessonsCount(
  supabase: SupabaseClient,
  studentEmail: string
): Promise<number> {
  const { count, error } = await supabase
    .from("student_progress")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("student_email", studentEmail)
    .eq("completed", true);

  if (error) {
    throw error;
  }

  return count ?? 0;
}
