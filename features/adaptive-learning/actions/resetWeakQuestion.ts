"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
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

  const {
    error,
  } = await supabase
    .from("question_attempts")
    .delete()
    .eq(
      "user_id",
      user.id
    )
    .eq(
      "question_id",
      questionId
    );

  if (error) {
    throw error;
  }

  await syncLessonMasteryAction(
    lessonId
  );

  revalidatePath(
    `/lessons/${lessonId}`
  );
}