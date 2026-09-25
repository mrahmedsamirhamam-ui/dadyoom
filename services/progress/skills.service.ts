import type { SupabaseClient } from "@supabase/supabase-js";

export async function increaseSkill(
  supabase: SupabaseClient,
  studentEmail: string,
  skill: string,
  value = 3
) {
  const email =
    studentEmail.trim();

  const normalizedSkill =
    skill.trim();

  if (!email) {
    throw new Error(
      "Student email is required."
    );
  }

  if (!normalizedSkill) {
    throw new Error(
      "Skill is required."
    );
  }

  const {
    data,
    error: readError,
  } = await supabase
    .from("student_skills")
    .select(
      "score,attempts,correct_attempts"
    )
    .eq(
      "student_email",
      email
    )
    .eq(
      "skill",
      normalizedSkill
    )
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  const currentScore =
    Number(data?.score ?? 0);

  const attempts =
    Number(data?.attempts ?? 0);

  const correctAttempts =
    Number(
      data?.correct_attempts ??
        0
    );

  const nextScore =
    Math.max(
      0,
      Math.min(
        currentScore +
          value,
        100
      )
    );

  const {
    error: saveError,
  } = await supabase
    .from("student_skills")
    .upsert(
      {
        student_email:
          email,
        skill:
          normalizedSkill,
        score:
          nextScore,
        attempts:
          attempts + 1,
        correct_attempts:
          correctAttempts +
          (value > 0 ? 1 : 0),
        updated_at:
          new Date()
            .toISOString(),
      },
      {
        onConflict:
          "student_email,skill",
      }
    );

  if (saveError) {
    throw saveError;
  }
}
