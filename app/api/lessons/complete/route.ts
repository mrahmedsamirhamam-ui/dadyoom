import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { completeLesson } from "@/services/lessons/complete-lesson";

type CompleteLessonRequest = {
  lessonId?: unknown;
};

type ProgressRow = {
  lesson_id: string | null;
  completed: boolean | null;
};

type LessonRow = {
  id: string;
  lesson_order: number | null;
  created_at: string | null;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "يجب تسجيل الدخول أولًا.",
        },
        { status: 401 }
      );
    }

    const body =
      (await request.json()) as CompleteLessonRequest;

    const lessonId = String(
      body.lessonId ?? ""
    ).trim();

    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          error: "معرّف الدرس مطلوب.",
        },
        { status: 400 }
      );
    }

    const result = await completeLesson({
      supabase,
      studentEmail: user.email,
      lessonId,
    });

    /*
     * بعد تسجيل إكمال الدرس، نجلب جميع الدروس المكتملة
     * ثم نختار أول درس منشور غير مكتمل.
     */
    const {
      data: progressData,
      error: progressError,
    } = await supabase
      .from("student_progress")
      .select("lesson_id, completed")
      .eq("student_email", user.email)
      .eq("completed", true);

    if (progressError) {
      throw progressError;
    }

    const progressRows =
      (progressData ?? []) as ProgressRow[];

    const completedLessonIds = new Set(
      progressRows
        .filter(
          (row) =>
            row.completed === true &&
            Boolean(row.lesson_id)
        )
        .map((row) => row.lesson_id as string)
    );

    const {
      data: lessonsData,
      error: lessonsError,
    } = await supabase
      .from("lessons")
      .select("id, lesson_order, created_at")
      .eq("is_published", true)
      .order("lesson_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: true,
      });

    if (lessonsError) {
      throw lessonsError;
    }

    const lessonRows =
      (lessonsData ?? []) as LessonRow[];

    const nextLesson =
      lessonRows.find(
        (lesson) =>
          lesson.id !== lessonId &&
          !completedLessonIds.has(lesson.id)
      ) ?? null;

    return NextResponse.json({
      success: true,
      newlyCompleted: result.newlyCompleted,

      earnedPoints:
        result.progress?.awardedXp ?? 0,

      nextLessonId:
        nextLesson?.id ?? null,

      progress: result.progress,
    });
  } catch (error) {
    console.error(
      "Complete lesson error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "تعذر إكمال الدرس الآن.",
      },
      { status: 500 }
    );
  }
}