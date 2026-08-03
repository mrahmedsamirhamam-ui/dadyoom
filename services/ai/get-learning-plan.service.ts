import type { SupabaseClient } from "@supabase/supabase-js";

export type LearningPlanRow = {
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  focus_skill: string | null;
  recommended_lesson: string | null;
  practice_type: "lesson" | "quiz" | "reading" | null;
  daily_goal: string | null;
  motivation: string | null;
};

export async function getLatestLearningPlan(
  supabase: SupabaseClient,
  studentEmail: string
): Promise<LearningPlanRow | null> {
  const { data, error } = await supabase
    .from("learning_plans")
    .select(
      `
        title,
        message,
        priority,
        focus_skill,
        recommended_lesson,
        practice_type,
        daily_goal,
        motivation
      `
    )
    .eq("student_email", studentEmail)
    .eq("completed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("GET_LATEST_LEARNING_PLAN_ERROR", error);
    throw new Error("تعذر تحميل خطة التعلم.");
  }

  return data as LearningPlanRow | null;
}