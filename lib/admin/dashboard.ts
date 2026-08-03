import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  const [
    profiles,
    lessons,
    progress,
    chats,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase
      .from("student_progress")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("chat_history")
      .select("*", { count: "exact", head: true }),
  ]);

  return {
    students: profiles.count ?? 0,
    lessons: lessons.count ?? 0,
    completedLessons: progress.count ?? 0,
    chats: chats.count ?? 0,
  };
}