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

const publicVideoAiEnabled =
  process.env.DADYOOM_VIDEO_AI_PUBLIC_ENABLED === "true";

export async function POST(request: Request) {
  if (!publicVideoAiEnabled) {
    return NextResponse.json(
      {
        error:
          "ميزة إنشاء فيديو الدرس بالذكاء الاصطناعي قيد التجهيز وستتوفر قريبًا.",
        code: "VIDEO_AI_COMING_SOON",
      },
      { status: 503 },
    );
  }

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
        prompt?: string;
        requestId?: string;
      };

    const lessonId =
      String(body.lessonId ?? "")
        .trim();

    const prompt =
      String(body.prompt ?? "")
        .trim()
        .slice(0, 6000);

    if (!lessonId && !prompt) {
      return NextResponse.json(
        {
          error:
            "اكتب برومبت الفيديو أولًا.",
        },
        { status: 400 },
      );
    }

    let lesson:
      | {
          id: string;
          title: string;
          summary: string | null;
          content: string | null;
          status: string;
        }
      | null = null;

    if (lessonId) {
      const {
        data,
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
        !data
      ) {
        return NextResponse.json(
          {
            error:
              "الدرس غير موجود أو غير منشور.",
          },
          { status: 404 },
        );
      }

      lesson = data;
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
            "id,user_id,lesson_id,prompt_text,attempted_providers,expires_at",
          )
          .eq(
            "id",
            requestId,
          )
          .eq(
            "user_id",
            user.id,
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
              lessonId || null,
            prompt_text:
              prompt || null,
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
          lesson
            ? String(
                lesson.title ?? "",
              )
            : "فيديو ضاديوم",
        summary:
          lesson?.summary
            ? String(
                lesson.summary,
              )
            : prompt || null,
        content:
          lesson?.content
            ? String(
                lesson.content,
              )
            : prompt || null,
        userPrompt:
          prompt || null,
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
        videoUrl:
          result.videoUrl,
        thumbnailUrl:
          result.thumbnailUrl,
        duration:
          result.duration,
        status:
          result.status,
        format:
          prompt
            ? "prompt-directed-video"
            : "lesson-cinematic-video",
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
          "تعذر بدء إنشاء الفيديو الآن. يحاول ضاديوم تلقائيًا استخدام محرك سحابي آخر عند توفره.",
      },
      { status: 503 },
    );
  }
}