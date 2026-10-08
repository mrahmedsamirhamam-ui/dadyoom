"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
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

  // Progress has been saved. Do not delay the Server Action response with
  // profile aggregation or path revalidation on CPU-constrained Workers.
  // The client refreshes the lesson after this action resolves.
  after(async () => {
    try {
      await syncLearningProfile(studentId, supabase);
      revalidatePath("/student");
      revalidatePath(`/lessons/${lessonId}`);
    } catch (error) {
      console.warn(
        "START_LESSON_POST_COMMIT_SYNC_WARNING",
        error instanceof Error ? error.message : "profile-sync-failed",
      );
    }
  });

  return result;
}
