import type { SupabaseClient } from "@supabase/supabase-js";

type UpdateStudentMemoryParams = {
  supabase: SupabaseClient;
  studentId: string;
};

export async function updateStudentMemory({
  supabase,
  studentId,
}: UpdateStudentMemoryParams) {
  const { data: assessments, error } = await supabase
    .from("assessment_session_answers")
    .select(`
      skill,
      is_correct
    `)
    .eq("student_id", studentId);

  if (error) {
    throw error;
  }

  const skills = new Map<
    string,
    {
      total: number;
      correct: number;
    }
  >();

  for (const row of assessments ?? []) {
    const skill =
      row.skill?.trim() || "الاستيعاب";

    const current =
      skills.get(skill) ?? {
        total: 0,
        correct: 0,
      };

    current.total++;

    if (row.is_correct) {
      current.correct++;
    }

    skills.set(skill, current);
  }

  const memory = Array.from(
    skills.entries()
  ).map(([skill, value]) => ({
    student_id: studentId,
    skill,
    score: Math.round(
      (value.correct /
        Math.max(value.total, 1)) *
        100
    ),
    attempts: value.total,
    updated_at: new Date().toISOString(),
  }));

  await supabase
    .from("student_memory")
    .upsert(memory, {
      onConflict:
        "student_id,skill",
    });

  return memory;
}