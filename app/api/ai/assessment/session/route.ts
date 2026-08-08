import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  startAssessmentSession,
} from "@/features/assessment/services/startAssessmentSession";

type StartSessionBody = {
  lessonId?: string;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as
        StartSessionBody;

    const lessonId =
      body.lessonId?.trim();

    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "تعذر تحديد الدرس.",
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

    const {
      data: lesson,
      error: lessonError,
    } = await supabase
      .from("lessons")
      .select("id,title")
      .eq("id", lessonId)
      .maybeSingle();

    if (
      lessonError ||
      !lesson
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "لم يتم العثور على الدرس.",
        },
        {
          status: 404,
        }
      );
    }

    const session =
      await startAssessmentSession({
        supabase,
        studentId: user.id,
        lessonId,
      });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        lessonId:
          session.lesson_id,
        lessonTitle:
          lesson.title,
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
      },
    });
  } catch (error) {
    console.error(
      "START_ASSESSMENT_SESSION_FAILED",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء بدء جلسة الاختبار.",
      },
      {
        status: 500,
      }
    );
  }
}