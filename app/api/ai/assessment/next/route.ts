import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  advanceAssessmentSession,
} from "@/features/assessment/services/advanceAssessmentSession";

import {
  getAssessmentSessionAnalytics,
} from "@/features/assessment/services/getAssessmentSessionAnalytics";

import {
  completeAdaptiveStep,
} from "@/features/learning-plan/services/adaptive-path-lifecycle";

type NextQuestionBody = {
  sessionId?: string;
  correct?: boolean;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as
        NextQuestionBody;

    const sessionId =
      body.sessionId?.trim();

    if (
      !sessionId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "بيانات جلسة الاختبار غير صالحة.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createClient();

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user?.email
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }

    // Browser 'correct' is ignored. Only a recorded, server-graded
    // answer can advance a student-owned published lesson session.
    const { data: authorizedSession, error: sessionError } = await supabase
      .from("assessment_sessions")
      .select("id,lesson_id,student_id,current_question,total_questions,correct_answers,wrong_answers,finished")
      .eq("id", sessionId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (sessionError) throw sessionError;
    if (!authorizedSession) {
      return NextResponse.json(
        { success: false, error: "جلسة الاختبار غير متاحة." },
        { status: 404 }
      );
    }

    const { data: publishedLesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", authorizedSession.lesson_id)
      .eq("status", "published")
      .maybeSingle();

    if (lessonError) throw lessonError;
    if (!publishedLesson) {
      return NextResponse.json(
        { success: false, error: "الدرس غير متاح للتقويم." },
        { status: 404 }
      );
    }

    const admin = createAdminClient();
    let authoritativeCorrect = false;
    if (!authorizedSession.finished) {
      const { data: savedAnswers, error: answersError } = await supabase
        .from("assessment_session_answers")
        .select("id,assessment_id,selected_answer,created_at")
        .eq("session_id", sessionId)
        .eq("student_id", user.id)
        .eq("lesson_id", publishedLesson.id)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });

      if (answersError) throw answersError;

      const previous = authorizedSession.correct_answers + authorizedSession.wrong_answers;
      if (!savedAnswers ||
          savedAnswers.length !== previous + 1 ||
          savedAnswers.length !== authorizedSession.current_question) {
        return NextResponse.json(
          { success: false, error: "يجب تسليم إجابة مصححة قبل الانتقال." },
          { status: 409 }
        );
      }

      const latest = savedAnswers[savedAnswers.length - 1];
      if (!latest) {
        return NextResponse.json(
          { success: false, error: "لا توجد إجابة جديدة." },
          { status: 409 }
        );
      }

      // Recalculate correctness from the trusted answer, not user-provided
      // is_correct or the boolean in POST /next.
      const { data: privateQuestion, error: keyError } = await admin
        .from("ai_assessments")
        .select("id,lesson_id,student_email,correct_answer,completed")
        .eq("id", latest.assessment_id)
        .eq("lesson_id", publishedLesson.id)
        .eq("student_email", user.email)
        .eq("completed", true)
        .maybeSingle();
      if (keyError) throw keyError;
      if (!privateQuestion) {
        return NextResponse.json(
          { success: false, error: "السؤال المصحح غير متاح." },
          { status: 404 }
        );
      }
      authoritativeCorrect =
        latest.selected_answer === privateQuestion.correct_answer;
    }

    const session = await advanceAssessmentSession({
      supabase: admin,
      sessionId,
      studentId: user.id,
      answeredCorrectly: authoritativeCorrect,
    });

    const answeredQuestions =
      session.correct_answers +
      session.wrong_answers;

    const score =
      Math.round(
        (
          session.correct_answers /
          Math.max(
            answeredQuestions,
            1
          )
        ) * 100
      );

    const analytics =
      session.finished
        ? await getAssessmentSessionAnalytics({
            supabase: admin,
            sessionId:
              session.id,
            studentId:
              user.id,
            studentEmail: user.email,
            lessonId: publishedLesson.id,
          })
        : null;

    /*
     * لا نغلق خطوة assessment إلا عندما
     * تنتهي جلسة الاختبار فعليًا.
     *
     * completeAdaptiveStep عملية idempotent،
     * لذلك إعادة الطلب بعد اكتمال الخطوة
     * لا تعيد إكمالها مرة أخرى.
     */
    const adaptiveAssessmentStep =
      session.finished &&
      session.lesson_id
        ? await completeAdaptiveStep({
            supabase,
            studentId:
              user.id,
            lessonId:
              session.lesson_id,
            stepType:
              "assessment",
          })
        : null;

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        lessonId:
          session.lesson_id,
        currentQuestion:
          session.current_question,
        totalQuestions:
          session.total_questions,
        correctAnswers:
          session.correct_answers,
        wrongAnswers:
          session.wrong_answers,
        difficulty:
          session.difficulty,
        finished:
          session.finished,
        score,
      },
      analytics,

      adaptivePath:
        adaptiveAssessmentStep
          ? {
              updated:
                adaptiveAssessmentStep.updated,

              reason:
                adaptiveAssessmentStep.reason,

              pathCompleted:
                adaptiveAssessmentStep.pathCompleted,

              currentStep:
                adaptiveAssessmentStep.currentStep,

              nextStep:
                adaptiveAssessmentStep.nextStep,
            }
          : null,
    });
  } catch (error) {
    console.error(
      "ADVANCE_ASSESSMENT_SESSION_FAILED",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "تعذر الانتقال إلى السؤال التالي.",
      },
      {
        status: 500,
      }
    );
  }
}
