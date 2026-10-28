"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncLessonMasteryAction } from "@/features/lesson-mastery/actions/syncLessonMastery";

export async function resetWeakQuestion(
  lessonId: string,
  questionId: string
) {
  const supabase =
    await createClient();

  const {
    data: { user },
    error: authError,
  } =
    await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(
      "يجب تسجيل الدخول لإعادة المحاولة."
    );
  }

  // The client-supplied pair is not proof the question belongs to this
  // lesson. Authorize published lesson + student-safe question with RLS
  // before creating any privileged client.
  const { data: visibleLesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", lessonId)
    .eq("status", "published")
    .maybeSingle();

  if (lessonError || !visibleLesson) {
    throw new Error("الدرس غير متاح لإعادة السؤال.");
  }

  const { data: visibleQuestion, error: questionError } = await supabase
    .from("dadyoom_student_questions")
    .select("id")
    .eq("id", questionId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (questionError || !visibleQuestion) {
    throw new Error("السؤال لا يتبع هذا الدرس المنشور.");
  }

  // Only a previously wrong attempt may be reset. Browser-granted DELETE
  // is not needed, so this works after authenticated grade-write cutover.
  const { data: wrongAttempt, error: attemptError } = await supabase
    .from("question_attempts")
    .select("id,is_correct")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .maybeSingle();

  if (attemptError) throw attemptError;
  if (!wrongAttempt || wrongAttempt.is_correct !== false) {
    throw new Error("لا توجد محاولة خاطئة قابلة للإعادة.");
  }

  const admin = createAdminClient();
  const { data: deleted, error: deleteError } = await admin
    .from("question_attempts")
    .delete()
    .eq("id", wrongAttempt.id)
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .eq("is_correct", false)
    .select("id")
    .maybeSingle();

  if (deleteError) throw deleteError;
  if (!deleted) {
    // Another request may have replaced the wrong attempt with a correct
    // answer after our read. Never delete that newly earned result.
    throw new Error("تغيرت حالة السؤال أثناء إعادة المحاولة.");
  }

  await syncLessonMasteryAction(
    lessonId
  );

  revalidatePath(
    `/lessons/${lessonId}`
  );
}
