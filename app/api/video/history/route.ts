import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  listBatchVideoHistory,
} from "@/lib/video/batch-fallback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "يجب تسجيل الدخول.",
        },
        { status: 401 },
      );
    }

    const jobs =
      await listBatchVideoHistory(
        user.id,
        20,
      );

    return NextResponse.json(
      {
        ok: true,
        jobs,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(
      "VIDEO_HISTORY_ERROR",
      error instanceof Error
        ? error.message
        : error,
    );

    return NextResponse.json(
      {
        error:
          "تعذر تحميل سجل الفيديو الآن.",
      },
      { status: 503 },
    );
  }
}
