import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseAnswerSubmission } from "@/lib/security/answer-submission";
import {
  feedbackForStudent,
  gradeStoredMcq,
} from "@/features/questions/services/grade-stored-mcq";

export async function POST(request: Request) {
  try {
    // Cookie-authenticated user, not a userId supplied by the requester.
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول أولًا." },
        { status: 401 }
      );
    }

    // JSON is required: browsers cannot submit a text/plain CSRF form.
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return NextResponse.json(
        { success: false, error: "صيغة الطلب غير مدعومة." },
        { status: 415, headers: { "Cache-Control": "no-store" } },
      );
    }
    const bodyText = await request.text().catch(() => "");
    if (bodyText.length > 4096) {
      return NextResponse.json(
        { success: false, error: "حجم الطلب أكبر من المسموح." },
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    }
    let parsed: unknown;
    try { parsed = JSON.parse(bodyText); }
    catch { parsed = null; }
    const submission = parseAnswerSubmission(parsed);
    if (!submission) {
      return NextResponse.json(
        { success: false, error: "معرّف السؤال أو الإجابة غير صحيح." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    const questionId = submission.questionId;

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
      return NextResponse.json(
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
      return NextResponse.json(
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
      submission.selectedAnswer
    );

    if (!grade.valid) {
      return NextResponse.json(
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
          selected_answer: submission.selectedAnswer,
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

    return NextResponse.json({
      success: true,
      ...feedback,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // Avoid leaking database details, service keys or internal queries.
    // Avoid logging raw answer keys or possibly sensitive DB error payloads.
    console.error("LESSON_QUESTION_GRADE_FAILED", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { success: false, error: "تعذر تصحيح الإجابة وحفظها. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
