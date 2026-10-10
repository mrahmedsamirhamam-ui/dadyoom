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

  // One PostgREST call instead of eight on this busy Cloudflare SSR route.
  // The SQL function is SECURITY INVOKER, explicitly checks auth.uid() and
  // the admin role, and preserves table RLS. Keep a strict compatibility
  // fallback for deployments where the migration has not reached the DB.
  try {
    const { data, error } = await supabase.rpc(
      "dadyoom_admin_dashboard_stats_v1" as never,
    );
    if (!error && data && typeof data === "object" && !Array.isArray(data)) {
      const row = data as Record<string, unknown>;
      const keys = [
        "students", "teachers", "parents", "schools",
        "lessons", "publishedLessons", "completedLessons", "chats",
      ] as const;
      if (keys.every((key) =>
        typeof row[key] === "number" &&
        Number.isSafeInteger(row[key]) &&
        Number(row[key]) >= 0
      )) {
        return Object.fromEntries(keys.map((key) => [key, Number(row[key])])) as {
          students: number; teachers: number; parents: number; schools: number;
          lessons: number; publishedLessons: number; completedLessons: number; chats: number;
        };
      }
    }
    console.warn("DADYOOM_ADMIN_STATS_RPC_FALLBACK", error?.code ?? "invalid-result");
  } catch (error) {
    console.warn("DADYOOM_ADMIN_STATS_RPC_FALLBACK",
      error instanceof Error ? error.message : String(error));
  }

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
