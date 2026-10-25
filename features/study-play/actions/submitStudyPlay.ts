"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { gradeStudyPlay, type StudyPlayAnswer, type StudyPlayRow } from "../services/grade-study-play";

const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function submitStudyPlay(
  lessonId: string,
  mode: "review" | "challenge",
  answers: StudyPlayAnswer[],
) {
  if (typeof lessonId !== "string" || !UUID.test(lessonId) ||
      (mode !== "review" && mode !== "challenge")) {
    throw new Error("بيانات التدريب غير صحيحة.");
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("سجل الدخول أولًا لحفظ نتائجك.");
  }

  // RLS-bound check before privileged reads; only published lessons qualify.
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons").select("id").eq("id", lessonId)
    .eq("status", "published").maybeSingle();

  if (lessonError || !lesson) {
    throw new Error("هذا الدرس غير متاح للتدريب.");
  }

  // Never use browser-supplied correct answers, scores, XP or student IDs.
  // The existing student-safe view excludes answer keys.
  const admin = createAdminClient();
  const { data: rows, error: rowsError } = await admin
    .from("questions")
    .select("id,question_type,options,correct_answer")
    .eq("lesson_id", lessonId)
    .order("question_order", { ascending: true })
    .limit(101);

  if (rowsError) {
    throw new Error("تعذر تحميل أسئلة الدرس للتصحيح.");
  }
  const result = gradeStudyPlay((rows ?? []) as StudyPlayRow[], answers);

  const earnedXp = Math.min(30, 5 + Math.round((result.score * 25) / 100));

  // Write with the user's own RLS-bound client. These rows are not credentials
  // or authority over learning mastery; user-facing XP is a game reward.
  const { error: saveError } = await supabase.from("edu_game_attempts").insert({
    student_id: user.id,
    lesson_id: lessonId,
    game_key: mode === "challenge" ? "study-play-challenge" : "study-play-review",
    score: result.correctAnswers,
    max_score: result.totalQuestions,
    xp_earned: earnedXp,
  });

  if (saveError) throw new Error("تم التصحيح، لكن تعذر حفظ النتيجة. أعد المحاولة.");

  revalidatePath("/student");
  revalidatePath("/lessons/" + lessonId + "/play");

  // Exclude per-question keys and correct option IDs from the response.
  return {
    score: result.score,
    totalQuestions: result.totalQuestions,
    correctAnswers: result.correctAnswers,
    passed: result.passed,
    earnedXp,
  };
}
