"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

import { startLesson } from "../services/progress";
import { syncLearningProfile } from "@/features/learning-profile/services/sync-profile";

export async function startLessonAction(
  lessonId: string,
  studentId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (
    authError ||
    !user ||
    user.id !== studentId
  ) {
    throw new Error(
      "غير مسموح ببدء الدرس."
    );
  }

  const result = await startLesson(
    studentId,
    lessonId
  );

  await syncLearningProfile(studentId);

  revalidatePath("/student");
  revalidatePath(`/lessons/${lessonId}`);

  return result;
}
