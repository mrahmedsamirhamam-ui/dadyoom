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

  const { data: existing, error: lookupError } = await supabase
    .from("assessment_sessions")
    .select(SESSION_FIELDS)
    .eq("student_id", studentId)
    .eq("lesson_id", lessonId)
    .eq("finished", false)
    .maybeSingle();

  if (lookupError) {
    // In particular, PostgREST's multiple-rows response must not be treated
    // like an empty lookup and followed by an additional INSERT.
    throw lookupError;
  }

  if (existing) {
    assertSessionOwnership(existing as Record<string, unknown>, studentId, lessonId);
    if (existing.finished) {
      throw new Error("جلسة الاختبار السابقة انتهت بالفعل.");
    }
    return existing;
  }

  const { data: created, error: createError } = await supabase
    .from("assessment_sessions")
    .insert({ student_id: studentId, lesson_id: lessonId })
    .select(SESSION_FIELDS)
    .single();

  if (createError) throw createError;
  if (!created) throw new Error("تعذر إنشاء جلسة الاختبار.");

  assertSessionOwnership(created as Record<string, unknown>, studentId, lessonId);
  if (created.finished) {
    throw new Error("جلسة الاختبار الجديدة غير صالحة.");
  }
  return created;
}
