import { NextResponse } from "next/server";

import { consumeFeature } from "@/lib/billing/access";
import { createClient } from "@/lib/supabase/server";
import {
  cinematicVideoConfigured,
  startTwoAvatarLessonVideo,
} from "@/lib/video/cinematic-avatar-agent";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول." },
        { status: 401 },
      );
    }

    if (!cinematicVideoConfigured()) {
      return NextResponse.json(
        {
          error:
            "ميزة فيديو الأفاتار السينمائي غير مفعلة بعد على حساب ضاديوم.",
          code:
            "CINEMATIC_VIDEO_NOT_CONFIGURED",
        },
        { status: 503 },
      );
    }

    const body =
      (await request.json()) as {
        lessonId?: string;
      };

    const lessonId =
      String(body.lessonId ?? "")
        .trim();

    if (!lessonId) {
      return NextResponse.json(
        {
          error:
            "اختر الدرس الذي تريد تحويله إلى فيديو.",
        },
        { status: 400 },
      );
    }

    const {
      data: lesson,
      error: lessonError,
    } =
      await supabase
        .from("lessons")
        .select(
          "id,title,summary,content,status",
        )
        .eq("id", lessonId)
        .eq("status", "published")
        .maybeSingle();

    if (
      lessonError ||
      !lesson
    ) {
      return NextResponse.json(
        {
          error:
            "الدرس غير موجود أو غير منشور.",
        },
        { status: 404 },
      );
    }

    const access =
      await consumeFeature(
        "video_ai",
      );

    if (!access.allowed) {
      return NextResponse.json(
        {
          error:
            `استخدمت فيديوهات AI المسموحة اليوم (${access.limit}).`,
          remaining:
            access.remaining,
          plan:
            access.plan,
        },
        { status: 429 },
      );
    }

    const result =
      await startTwoAvatarLessonVideo({
        title:
          String(
            lesson.title ?? "",
          ),
        summary:
          lesson.summary
            ? String(
                lesson.summary,
              )
            : null,
        content:
          lesson.content
            ? String(
                lesson.content,
              )
            : null,
      });

    return NextResponse.json(
      {
        sessionId:
          result.sessionId,
        videoId:
          result.videoId,
        status:
          result.status,
        format:
          "two-avatar-cinematic-dialogue",
      },
      { status: 202 },
    );
  } catch (error) {
    console.error(
      "CINEMATIC_VIDEO_CREATE_ERROR",
      error instanceof Error
        ? error.message
        : error,
    );

    return NextResponse.json(
      {
        error:
          "تعذر بدء إنشاء فيديو الأفاتار الآن. حاول مرة أخرى بعد قليل.",
      },
      { status: 503 },
    );
  }
}
