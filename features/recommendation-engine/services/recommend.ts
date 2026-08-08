import { createClient } from "@/lib/supabase/server";

export async function recommendNextLesson(
  studentId: string
) {
  const supabase = await createClient();

  const { data: progress } = await supabase
    .from("student_lesson_progress")
    .select("lesson_id,status")
    .eq("student_id", studentId);

  const completed =
    (progress ?? [])
      .filter(
        (x) =>
          x.status === "completed" ||
          x.status === "mastered"
      )
      .map((x) => x.lesson_id);

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("status", "published")
    .not("id", "in", `(${completed.join(",") || "''"})`)
    .order("lesson_number")
    .limit(1)
    .maybeSingle();

  return lesson;
}