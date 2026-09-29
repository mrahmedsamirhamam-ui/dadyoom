import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  BATCH_VIDEO_PROVIDER,
  getBatchVideoStatus,
} from "@/lib/video/batch-fallback";
import {
  getCinematicVideoStatus,
  isCinematicProviderId,
} from "@/lib/video/cinematic-avatar-agent";

export const runtime = "nodejs";

function safeId(value: string) {
  return /^[A-Za-z0-9_-]{3,200}$/u.test(value);
}

export async function GET(request: Request) {
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

    const url =
      new URL(request.url);

    const sessionId =
      String(
        url.searchParams.get(
          "sessionId",
        ) ?? "",
      ).trim();

    const provider =
      String(
        url.searchParams.get(
          "provider",
        ) ?? "",
      ).trim();

    const videoId =
      String(
        url.searchParams.get(
          "videoId",
        ) ?? "",
      ).trim();

    if (
      !provider ||
      !sessionId ||
      !safeId(sessionId) ||
      (
        videoId &&
        !safeId(videoId)
      )
    ) {
      return NextResponse.json(
        {
          error:
            "بيانات مهمة الفيديو غير صالحة.",
        },
        { status: 400 },
      );
    }

    if (
      provider ===
      BATCH_VIDEO_PROVIDER
    ) {
      const batch =
        await getBatchVideoStatus({
          userId:
            user.id,
          jobId:
            videoId ||
            sessionId,
        });

      if (!batch) {
        return NextResponse.json(
          {
            error:
              "مهمة الفيديو غير موجودة.",
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        batch,
        {
          status: 200,
          headers: {
            "Cache-Control":
              "no-store, max-age=0",
          },
        },
      );
    }

    if (
      !isCinematicProviderId(
        provider,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "بيانات مهمة الفيديو غير صالحة.",
        },
        { status: 400 },
      );
    }

    const result =
      await getCinematicVideoStatus({
        provider,
        sessionId,
        videoId:
          videoId ||
          undefined,
      });

    return NextResponse.json(
      result,
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "CINEMATIC_VIDEO_STATUS_ERROR",
      error instanceof Error
        ? error.message
        : error,
    );

    return NextResponse.json(
      {
        status:
          "failed",
        message:
          "تعذر متابعة حالة الفيديو الآن. حاول مرة أخرى بعد قليل.",
      },
      { status: 503 },
    );
  }
}
