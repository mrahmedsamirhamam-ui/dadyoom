import type { SupabaseClient } from "@supabase/supabase-js";

async function getCurrentStudentId(
  supabase: SupabaseClient,
  fallbackEmail?: string
): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!userError && user) {
    return user.id;
  }

  if (fallbackEmail) {
    const { data: profile, error: profileError } = await (
      supabase.from("profiles") as any
    )
      .select("id")
      .eq("email", fallbackEmail)
      .maybeSingle();

    if (!profileError && profile?.id) {
      return profile.id;
    }
  }

  throw new Error("تعذر تحديد حساب الطالب الحالي.");
}

/**
 * يحافظ على التوقيع القديم حتى لا تتعطل الاستدعاءات الحالية.
 * studentEmail يُستخدم كخيار احتياطي فقط.
 */
export async function completeLesson(
  supabase: SupabaseClient,
  studentEmail: string,
  lessonId: string
) {
  const studentId = await getCurrentStudentId(
    supabase,
    studentEmail
  );

  const completedAt = new Date().toISOString();

  const { data: lesson, error: lessonError } = await (
    supabase.from("edu_lessons") as any
  )
    .select("points_reward")
    .eq("id", lessonId)
    .single();

  if (lessonError) {
    throw new Error(lessonError.message);
  }

  const { data, error } = await (
    supabase.from("edu_learner_progress") as any
  )
    .upsert(
      {
        student_id: studentId,
        lesson_id: lessonId,
        status: "completed",
        progress_percent: 100,
        score: 100,
        started_at: completedAt,
        completed_at: completedAt,
        last_opened_at: completedAt,
      },
      {
        onConflict: "student_id,lesson_id",
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const points = Number(lesson?.points_reward ?? 10);

  const { error: pointsError } = await (
    supabase.from("edu_point_transactions") as any
  ).insert({
    student_id: studentId,
    lesson_id: lessonId,
    points,
    reason: "lesson_completed",
    metadata: {
      source: "services/progress.ts",
    },
  });

  // لا نفشل إكمال الدرس إذا كانت سياسة إدخال النقاط لم تُفعّل بعد.
  if (pointsError) {
    console.warn(
      "POINT_TRANSACTION_INSERT_FAILED",
      pointsError.message
    );
  }

  return data;
}
