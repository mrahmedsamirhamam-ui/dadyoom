import { createClient } from "@/lib/supabase/server";

type ProfileInput = {
  studentId: string;
  level: number;
  xp: number;
  completed: number;
  mastered: number;
  averageScore: number;
};

export async function updateLearningProfile(
  input: ProfileInput
) {
  const supabase = await createClient();

  const { error } =
    await supabase
      .from("student_learning_profile")
      .upsert({
        student_id: input.studentId,
        current_level: input.level,
        total_xp: input.xp,
        completed_lessons: input.completed,
        mastered_lessons: input.mastered,
        average_score: input.averageScore,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

  if (error) {
    throw error;
  }
}
