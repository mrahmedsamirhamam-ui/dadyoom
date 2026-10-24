import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type Params = {
  /** The server-only service client, after authenticated lesson validation. */
  supabase: SupabaseClient;
  studentId: string;
  lessonId: string;
};

// This is the minimal session projection needed by the StartSession route.
// Never return new schema columns just because the table grew.
const SESSION_FIELDS =
  "id,student_id,lesson_id,current_question,total_questions,correct_answers,wrong_answers,difficulty,finished,updated_at" as const;

function assertSessionOwnership(
  row: Record<string, unknown>,
  studentId: string,
  lessonId: string,
): void {
  if (
    !row.id ||
    row.student_id !== studentId ||
    row.lesson_id !== lessonId ||
    typeof row.finished !== "boolean"
  ) {
    throw new Error("بيانات جلسة الاختبار غير متسقة مع حساب الطالب.");
  }
}

/**
 * Reuse an unfinished owned session, or create one only after a successful
 * lookup. Never interpret a failed read (including multiple unfinished
 * sessions) as "no session": doing so creates additional active sessions and
 * can split assessed answers across them.
 *
 * Requires a server-only Supabase client; the route must validate the signed
 * in user and published lesson before calling this service.
 */
export async function startAssessmentSession({
  supabase,
  studentId,
  lessonId,
}: Params) {
  if (!studentId.trim() || !lessonId.trim()) {
    throw new Error("يجب تحديد الطالب والدرس قبل بدء التقييم.");
  }

  const findOpenSession = async () => {
    const { data, error } = await supabase
      .from("assessment_sessions")
      .select(SESSION_FIELDS)
      .eq("student_id", studentId)
      .eq("lesson_id", lessonId)
      .eq("finished", false)
      .maybeSingle();

    // A failed or ambiguous read is never an excuse to create another row.
    if (error) throw error;
    if (data) {
      assertSessionOwnership(data as Record<string, unknown>, studentId, lessonId);
      if (data.finished) {
        throw new Error("جلسة الاختبار السابقة انتهت بالفعل.");
      }
    }
    return data;
  };

  const existing = await findOpenSession();
  if (existing) return existing;

  const { data: created, error: createError } = await supabase
    .from("assessment_sessions")
    .insert({ student_id: studentId, lesson_id: lessonId })
    .select(SESSION_FIELDS)
    .single();

  if (createError) {
    // Only the specifically named partial-unique index can indicate the
    // concurrent server request successfully created this same open session.
    // Do not swallow other uniqueness errors or invent a new session.
    const uniqueIndex = "assessment_sessions_one_unfinished_per_student_lesson";
    const raceConflict = createError.code === "23505" &&
      (createError.message.includes(uniqueIndex) ||
        (createError.details ?? "").includes(uniqueIndex));
    if (raceConflict) {
      const winner = await findOpenSession();
      if (winner) return winner;
    }
    throw createError;
  }
  if (!created) throw new Error("تعذر إنشاء جلسة الاختبار.");

  assertSessionOwnership(created as Record<string, unknown>, studentId, lessonId);
  if (created.finished) {
    throw new Error("جلسة الاختبار الجديدة غير صالحة.");
  }
  return created;
}
