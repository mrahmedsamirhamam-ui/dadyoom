import { createClient } from "@/lib/supabase/server";

async function exactCount(
  query: PromiseLike<{
    count: number | null;
    error: { message: string } | null;
  }>,
  label: string
) {
  const result = await query;

  if (result.error) {
    throw new Error(
      `${label}: ${result.error.message}`
    );
  }

  return result.count ?? 0;
}

export async function getDashboardStats() {
  const supabase = await createClient();

  const [
    students,
    teachers,
    parents,
    schools,
    lessons,
    publishedLessons,
    completedLessons,
    chats,
  ] = await Promise.all([
    exactCount(
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "student"),
      "students"
    ),

    exactCount(
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "teacher"),
      "teachers"
    ),

    exactCount(
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "parent"),
      "parents"
    ),

    exactCount(
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "school"),
      "schools"
    ),

    exactCount(
      supabase
        .from("lessons")
        .select("id", { count: "exact", head: true }),
      "lessons"
    ),

    exactCount(
      supabase
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      "published lessons"
    ),

    exactCount(
      supabase
        .from("student_lesson_progress")
        .select("id", { count: "exact", head: true })
        .in("status", ["completed", "mastered"]),
      "completed lessons"
    ),

    exactCount(
      supabase
        .from("chat_history")
        .select("id", { count: "exact", head: true }),
      "chats"
    ),
  ]);

  return {
    students,
    teachers,
    parents,
    schools,
    lessons,
    publishedLessons,
    completedLessons,
    chats,
  };
}
