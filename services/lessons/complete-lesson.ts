import type { SupabaseClient } from "@supabase/supabase-js";

import type { Skill } from "@/lib/constants/skills";
import { StudentEventType } from "@/services/events";
import {
  processLessonCompleted,
  type LessonProgressResult,
} from "@/services/progress/progress-engine";

type CompleteLessonParams = {
  supabase: SupabaseClient;
  studentEmail: string;
  lessonId: string;
};

type LessonMetadata = {
  skill: Skill;
  points: number;
  unit_id: string | null;
};

export type CompleteLessonResult = {
  newlyCompleted: boolean;
  progress: LessonProgressResult | null;
};

export async function completeLesson({
  supabase,
  studentEmail,
  lessonId,
}: CompleteLessonParams): Promise<CompleteLessonResult> {
  const email = studentEmail.trim();
  const normalizedLessonId = lessonId.trim();

  if (!email) {
    throw new Error("Student email is required.");
  }

  if (!normalizedLessonId) {
    throw new Error("Lesson ID is required.");
  }

  const {
    data: existingProgress,
    error: readError,
  } = await supabase
    .from("student_progress")
    .select("completed")
    .eq("student_email", email)
    .eq("lesson_id", normalizedLessonId)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (existingProgress?.completed === true) {
    return {
      newlyCompleted: false,
      progress: null,
    };
  }

  /*
   * نجلب بيانات الدرس قبل تسجيل إكماله.
   * إذا لم يكن الدرس موجودًا فلن نسجل تقدمًا غير صالح.
   */
  const { data: lessonData, error: lessonError } =
    await supabase
      .from("lessons")
      .select("skill, points, unit_id")
      .eq("id", normalizedLessonId)
      .single();

  if (lessonError || !lessonData) {
    throw lessonError ?? new Error("Lesson not found.");
  }

  const lesson = lessonData as LessonMetadata;
  const completedAt = new Date();

  const { error: saveError } = await supabase
    .from("student_progress")
    .upsert(
      {
        student_email: email,
        lesson_id: normalizedLessonId,
        completed: true,
        completed_at: completedAt.toISOString(),
      },
      {
        onConflict: "student_email,lesson_id",
      }
    );

  if (saveError) {
    throw saveError;
  }

  const progress = await processLessonCompleted({
    type: StudentEventType.LESSON_COMPLETED,
    supabase,
    studentEmail: email,
    lessonId: normalizedLessonId,
    courseId: lesson.unit_id ?? undefined,
    skill: lesson.skill,
    xp: lesson.points,
    reason: `Completed lesson: ${normalizedLessonId}`,
    createdAt: completedAt,
  });

  return {
    newlyCompleted: true,
    progress,
  };
}