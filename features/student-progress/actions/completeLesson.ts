"use server";

import { completeLessonCore } from "@/features/student-progress/services/complete-lesson-core";

/** Preserve the public Server Action contract for existing lesson pages. */
export async function completeLessonAction(progressId: string) {
  return completeLessonCore(progressId);
}
