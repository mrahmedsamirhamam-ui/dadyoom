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
      !sessionId ||
      typeof body.correct !==
        "boolean"
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
      !user
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

    const session =
      await advanceAssessmentSession({
        supabase,
        sessionId,
        studentId: user.id,
        answeredCorrectly:
          body.correct,
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
            supabase,
            sessionId:
              session.id,
            studentId:
              user.id,
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
