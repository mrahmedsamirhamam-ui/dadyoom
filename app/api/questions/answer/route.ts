import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  feedbackForStudent,
  gradeStoredMcq,
} from "@/features/questions/services/grade-stored-mcq";

type AnswerRequest = {
  questionId?: unknown;
  selectedAnswer?: unknown;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function studentJson(body: unknown, init?: { status: number }) {
  return NextResponse.json(body, {
    ...init,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  try {
    // Cookie-authenticated user, not a userId supplied by the requester.
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return studentJson(
        { success: false, error: "يجب تسجيل الدخول أولًا." },
        { status: 401 }
      );
    }

    // Reject browser form submissions; the JSON client must pass CORS
    // preflight when cross-origin. Feedback is always private and uncached.
    const mediaType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (mediaType !== "application/json") {
      return studentJson(
        { success: false, error: "نوع الطلب غير مدعوم." },
        { status: 415 }
      );
    }

    const raw = (await request.json().catch(() => null)) as AnswerRequest | null;
    const questionId = raw?.questionId;
    if (typeof questionId !== "string" || !UUID.test(questionId)) {
      return studentJson(
        { success: false, error: "معرّف السؤال غير صحيح." },
        { status: 400 }
      );
    }

    // Server-only access to the answer key: this continues to work after
    // revoking browser SELECT privileges for questions.correct_answer.
    // The authenticated caller MUST still pass the published lesson's RLS
    // check below before any feedback or attempt is persisted.
    const admin = createAdminClient();
    const { data: question, error: questionError } = await admin
      .from("questions")
      .select("id,lesson_id,question_type,options,correct_answer,explanation")
      .eq("id", questionId)
      .maybeSingle();

    if (questionError) throw questionError;
    if (!question) {
      return studentJson(
        { success: false, error: "السؤال غير متاح." },
        { status: 404 }
      );
    }

    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id,status")
      .eq("id", question.lesson_id)
      .maybeSingle();

    if (lessonError) throw lessonError;
    if (!lesson || lesson.status !== "published") {
      return studentJson(
        { success: false, error: "الدرس غير متاح للتقويم." },
        { status: 404 }
      );
    }

    const grade = gradeStoredMcq(
      {
        question_type: question.question_type,
        options: question.options,
        correct_answer: question.correct_answer,
      },
      raw?.selectedAnswer
    );

    if (!grade.valid) {
      return studentJson(
        { success: false, error: "الإجابة أو إعداد السؤال غير صالح للتصحيح." },
        { status: 400 }
      );
    }

    // Privileged write happens ONLY after user verification and the server's
    // independently fetched, validated answer key. No client-supplied grade.
    // This existing server-only helper requires SUPABASE_SERVICE_ROLE_KEY.
    // Reuse the same isolated privileged client after the caller's lesson
    // visibility has been checked with the RLS-bound client above.
    const { error: saveError } = await admin
      .from("question_attempts")
      .upsert(
        {
          user_id: user.id,
          question_id: question.id,
          selected_answer: raw?.selectedAnswer as string,
          is_correct: grade.isCorrect,
          answered_at: new Date().toISOString(),
        },
        { onConflict: "user_id,question_id" }
      );

    if (saveError) throw saveError;

    // Do not reveal the correct key or explanatory solution after an
    // incorrect response. Review and retry are separate from answer disclosure.
    const feedback = feedbackForStudent(
      grade,
      question.explanation ?? null
    );

    return studentJson({
      success: true,
      ...feedback,
    });
  } catch (error) {
    // Avoid leaking database details, service keys or internal queries.
    console.error("LESSON_QUESTION_GRADE_FAILED", error);
    return studentJson(
      { success: false, error: "تعذر تصحيح الإجابة وحفظها. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
