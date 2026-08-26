import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient =
  Awaited<ReturnType<typeof createClient>>;

export async function getContinueLesson(
  studentId: string,
  supabaseClient?: ServerSupabaseClient
) {
  const supabase =
    supabaseClient ??
    (await createClient());

  const { data } =
    await supabase
      .from("student_lesson_progress")
      .select(`
        lesson_id,
        status,
        lessons(title)
      `)
      .eq("student_id", studentId)
      .neq("status", "mastered")
      .order("updated_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  return data;
}
