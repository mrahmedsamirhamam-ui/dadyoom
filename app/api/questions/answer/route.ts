import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeStoredMcq } from "@/features/questions/services/grade-stored-mcq";

type AnswerRequest = {
  questionId?: unknown;
  selectedAnswer?: unknown;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    const raw = (await request.json().catch(() => null)) as AnswerRequest | null;
    const questionId = raw?.questionId;
    if (typeof questionId !== "string" || !UUID.test(questionId)) {
      return NextResponse.json(
        { success: false, error: "معرّف السؤال غير صحيح." },
        { status: 400 }
      );
    }

    // Read using the caller's RLS, not an admin client.
    const { data: question, error: questionError } = await supabase
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
      raw?.selectedAnswer
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
    const admin = createAdminClient();
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

    return NextResponse.json({
      success: true,
      isCorrect: grade.isCorrect,
      correctAnswer: grade.correctAnswer,
      explanation: question.explanation ?? null,
    });
  } catch (error) {
    // Avoid leaking database details, service keys or internal queries.
    console.error("LESSON_QUESTION_GRADE_FAILED", error);
    return NextResponse.json(
      { success: false, error: "تعذر تصحيح الإجابة وحفظها. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
