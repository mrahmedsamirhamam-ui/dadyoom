import type {
  StudentProgressRow,
  LearningProfileRow,
} from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StudentProgressItem = {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  progress_percent: number;
  score: number | null;
  status: "not_started" | "in_progress" | "completed";
};

async function resolveStudentId(
  supabase: SupabaseClient,
  email?: string
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return user.id;
  }

  if (email) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle<LearningProfileRow>();

    if (data?.id) {
      return data.id;
    }
  }

  throw new Error("ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø·Ø§Ù„Ø¨ Ø§Ù„Ø­Ø§Ù„ÙŠ.");
}

export async function getStudentProgress(
  supabase: SupabaseClient,
  email: string
): Promise<StudentProgressItem[]> {
  const studentId = await resolveStudentId(
    supabase,
    email
  );

  const { data, error } = await supabase
    .from("edu_learner_progress")
    .select(`
      lesson_id,
      status,
      progress_percent,
      score,
      completed_at
    `)
    .eq("student_id", studentId)
    .order("last_opened_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const progressData = (data ?? []) as unknown as StudentProgressRow[];

  return progressData.map((item: StudentProgressRow) => ({
    lesson_id: item.lesson_id,
    completed: item.status === "completed",
    completed_at: item.completed_at ?? null,
    progress_percent: Number(item.progress_percent ?? 0),
    score:
      item.score === null || item.score === undefined
        ? null
        : Number(item.score),
    status: item.status as "not_started" | "in_progress" | "completed",
  }));
}
