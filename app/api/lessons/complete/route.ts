import { NextResponse } from "next/server";

import { completeLessonAction } from "@/features/student-progress/actions/completeLesson";
import { createClient } from "@/lib/supabase/server";

type CompleteLessonBody = {
  lessonId?: string;
};

function isCompletionGateError(message: string) {
  return (
    message.includes("أكمل أنشطة التقويم المطلوبة") ||
    message.includes("مستوى إتقانك الحالي") ||
    message.includes("المطلوب 90%") ||
    message.includes("إنهاء الدرس")
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as CompleteLessonBody;

    const lessonId =
      body.lessonId?.trim();

    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          error: "معرّف الدرس غير موجود.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * DADYOOM_CANONICAL_LEGACY_COMPLETION_BRIDGE_V1
     *
     * This endpoint is retained only for compatibility.
     * It MUST NOT mark a lesson complete directly.
     *
     * All completion semantics are delegated to
     * completeLessonAction(), which enforces:
     *
     * - authenticated ownership
     * - required activity completion
     * - activity/question grading
     * - >= 90% mastery
     * - lesson mastery synchronization
     * - canonical student_lesson_progress
     * - gamification/cache/adaptive side effects
     */

    const {
      data: progress,
      error: progressError,
    } = await supabase
      .from("student_lesson_progress")
      .select(
        "id,student_id,lesson_id,status,progress_percent,best_score"
      )
      .eq(
        "student_id",
        user.id
      )
      .eq(
        "lesson_id",
        lessonId
      )
      .maybeSingle();

    if (progressError) {
      return NextResponse.json(
        {
          success: false,
          error: progressError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!progress) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ابدأ الدرس ونفّذ أنشطته المطلوبة قبل محاولة إنهائه.",
          canonicalGate: true,
        },
        {
          status: 409,
        }
      );
    }

    await completeLessonAction(
      progress.id
    );

    return NextResponse.json({
      success: true,
      lessonId,
      canonicalGate: true,
      message:
        "تم إكمال الدرس عبر بوابة ضاديوم المعتمدة.",
    });
  } catch (cause) {
    const message =
      cause instanceof Error
        ? cause.message
        : "حدث خطأ أثناء إكمال الدرس.";

    return NextResponse.json(
      {
        success: false,
        error: message,
        canonicalGate: true,
      },
      {
        status: isCompletionGateError(message)
          ? 409
          : 500,
      }
    );
  }
}
