"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { readCompleteGradingPages } from "@/lib/lesson-activities/read-complete-pages";
import { gradeStudyPlay, validateStudyPlaySubmission, type StudyPlayAnswer, type StudyPlayRow } from "../services/grade-study-play";

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
  // Fail closed on arbitrary Server Action arguments before any DB calls.
  const validatedAnswers = validateStudyPlaySubmission(answers);
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

  // Read the exact learner-visible, RLS-scoped question IDs before opening
  // the elevated client. Never score an unseen, hidden or draft question.
  // Request exactly the complete learner-visible question set. A low
  // PostgREST max-rows cap must never quietly turn a full lesson into a
  // smaller, falsely scored game.
  const visibleQuestions = await readCompleteGradingPages({
    pageSize: 75,
    maxRows: 100,
    readPage: async (offset, limit) => {
      const { data, count, error } = await supabase
        .from("dadyoom_student_questions")
        .select("id", { count: "exact" })
        .eq("lesson_id", lessonId)
        .order("id", { ascending: true })
        .range(offset, offset + limit - 1);
      return { data, count, error };
    },
  });
  const visibleIds = visibleQuestions.map((question) => question.id);
  if (visibleIds.length === 0) {
    throw new Error("لا توجد أسئلة مرئية كافية لهذا الدرس.");
  }

  // Never use browser-supplied correct answers, scores, XP or student IDs.
  const admin = createAdminClient();
  const storedRows = await readCompleteGradingPages({
    pageSize: 75,
    maxRows: 100,
    readPage: async (offset, limit) => {
      const { data, count, error } = await admin
        .from("questions")
        .select("id,question_type,options,correct_answer", { count: "exact" })
        .eq("lesson_id", lessonId)
        .order("id", { ascending: true })
        .range(offset, offset + limit - 1);
      return { data, count, error };
    },
  }) as StudyPlayRow[];
  if (storedRows.length !== visibleIds.length ||
      storedRows.some((item) => !visibleIds.includes(item.id))) {
    throw new Error("أسئلة الدرس المرئية لا تطابق بنك التصحيح.");
  }
  const result = gradeStudyPlay(storedRows, validatedAnswers);

  // Do not issue cumulative XP until a database-enforced once-per-lesson
  // award ledger exists. Otherwise repeated correct replays can farm XP.
  const earnedXp = 0;

  // Bound score-history writes to 10 per lesson/mode per rolling 24 hours.
  // This is operational throttling, NOT an atomic anti-bot rate limiter.
  const gameKey = mode === "challenge" ? "study-play-challenge" : "study-play-review";
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent, error: recentError } = await admin
    .from("edu_game_attempts")
    .select("id")
    .eq("student_id", user.id)
    .eq("lesson_id", lessonId)
    .eq("game_key", gameKey)
    .gte("created_at", oneDayAgo)
    .limit(10);
  if (recentError) {
    throw new Error("تعذر التحقق من سجل المحاولات.");
  }
  if ((recent ?? []).length >= 10) {
    throw new Error("وصلت للحد اليومي لمحاولات هذا التحدي. يمكنك المراجعة مجددًا لاحقًا.");
  }

  // Privileged write only after authentication, lesson visibility, complete
  // grading and bounded retry checks. Browser direct INSERT remains P0 #57.
  const { error: saveError } = await admin.from("edu_game_attempts").insert({
    student_id: user.id,
    lesson_id: lessonId,
    game_key: gameKey,
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
