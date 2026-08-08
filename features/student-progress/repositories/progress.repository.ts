import { createClient } from "@/lib/supabase/server";

export async function getLessonProgress(
  studentId: string,
  lessonId: string
) {
  const supabase = await createClient();

  return supabase
    .from("student_lesson_progress")
    .select("*")
    .eq("student_id", studentId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
}

export async function createLessonProgress(
  data: {
    student_id: string;
    lesson_id: string;
  }
) {
  const supabase = await createClient();

  return supabase
    .from("student_lesson_progress")
    .insert({
      ...data,
      status: "in_progress",
      progress_percent: 0,
      attempts: 0,
      best_score: 0,
      last_score: 0,
      xp: 0,
      time_spent_seconds: 0,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
}

export async function updateLessonProgress(
  id: string,
  values: Record<string, unknown>
) {
  const supabase = await createClient();

  return supabase
    .from("student_lesson_progress")
    .update(values)
    .eq("id", id)
    .select()
    .single();
}