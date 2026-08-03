import type { SupabaseClient } from "@supabase/supabase-js";

export type SavedAiRecommendation = {
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  lessonId: string | null;
  createdAt: string | null;
};

type RecommendationRow = {
  title: string;
  message: string;
  priority: string | null;
  lesson_id: string | null;
  created_at: string | null;
};

export async function getLatestRecommendation(
  supabase: SupabaseClient,
  studentEmail: string
): Promise<SavedAiRecommendation | null> {
  const { data, error } = await supabase
    .from("ai_recommendations")
    .select("title, message, priority, lesson_id, created_at")
    .eq("student_email", studentEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("GET_AI_RECOMMENDATION_ERROR", error);
    return null;
  }

  const row = data as RecommendationRow | null;

  if (!row) {
    return null;
  }

  return {
    title: row.title,
    message: row.message,
    priority:
      row.priority === "high" || row.priority === "low"
        ? row.priority
        : "medium",
    lessonId: row.lesson_id,
    createdAt: row.created_at,
  };
}