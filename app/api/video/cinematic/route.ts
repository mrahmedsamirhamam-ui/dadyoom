import { NextResponse } from "next/server";

import { consumeFeature } from "@/lib/billing/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  cinematicVideoConfigured,
  configuredCinematicProviderIds,
  startCinematicLessonVideo,
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
        requestId?: string;
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

    const admin =
      createAdminClient();

    let requestId =
      String(
        body.requestId ?? "",
      ).trim();

    let attemptedProviders: string[] =
      [];

    if (requestId) {
      const {
        data: existingRequest,
        error: requestError,
      } =
        await admin
          .from(
            "video_generation_requests",
          )
          .select(
            "id,user_id,lesson_id,attempted_providers,expires_at",
          )
          .eq(
            "id",
            requestId,
          )
          .eq(
            "user_id",
            user.id,
          )
          .eq(
            "lesson_id",
            lessonId,
          )
          .maybeSingle();

      const expired =
        existingRequest?.expires_at
          ? new Date(
              existingRequest.expires_at,
            ).getTime() <=
            Date.now()
          : true;

      if (
        requestError ||
        !existingRequest ||
        expired
      ) {
        return NextResponse.json(
          {
            error:
              "انتهت جلسة إنشاء الفيديو. ابدأ محاولة جديدة.",
          },
          { status: 409 },
        );
      }

      attemptedProviders =
        Array.isArray(
          existingRequest.attempted_providers,
        )
          ? existingRequest.attempted_providers
              .map((value) =>
                String(value),
              )
              .filter(Boolean)
          : [];
    } else {
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

      const {
        data: newRequest,
        error: createRequestError,
      } =
        await admin
          .from(
            "video_generation_requests",
          )
          .insert({
            user_id:
              user.id,
            lesson_id:
              lessonId,
          })
          .select(
            "id",
          )
          .single();

      if (
        createRequestError ||
        !newRequest?.id
      ) {
        console.error(
          "VIDEO_REQUEST_CREATE_FAILED",
          createRequestError?.message,
        );

        return NextResponse.json(
          {
            error:
              "تعذر بدء جلسة الفيديو الآن. حاول مرة أخرى.",
          },
          { status: 500 },
        );
      }

      requestId =
        String(
          newRequest.id,
        );
    }

    const result =
      await startCinematicLessonVideo({
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
        excludeProviders:
          attemptedProviders,
      });

    const nextAttemptedProviders =
      Array.from(
        new Set([
          ...attemptedProviders,
          result.provider,
        ]),
      );

    const {
      error: updateRequestError,
    } =
      await admin
        .from(
          "video_generation_requests",
        )
        .update({
          attempted_providers:
            nextAttemptedProviders,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          requestId,
        )
        .eq(
          "user_id",
          user.id,
        );

    if (updateRequestError) {
      console.error(
        "VIDEO_REQUEST_UPDATE_FAILED",
        updateRequestError.message,
      );
    }

    return NextResponse.json(
      {
        requestId,
        provider:
          result.provider,
        sessionId:
          result.sessionId,
        videoId:
          result.videoId,
        status:
          result.status,
        format:
          "two-avatar-cinematic-dialogue",
        degraded:
          Boolean(
            result.degraded,
          ),
        configuredProviders:
          configuredCinematicProviderIds(),
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
