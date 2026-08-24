import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

type Body = {
  lessonId?: unknown;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as Body;

    const lessonId =
      typeof body.lessonId ===
      "string"
        ? body.lessonId.trim()
        : "";

    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "lessonId مطلوب.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createClient();

    const {
      count,
      error,
    } =
      await supabase
        .from(
          "lesson_activities"
        )
        .select(
          "id",
          {
            count:
              "exact",
            head:
              true,
          }
        )
        .eq(
          "lesson_id",
          lessonId
        );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      count:
        count ?? 0,
    });
  }
  catch (error) {
    console.error(
      "ACTIVITY_COUNT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "تعذر حساب أنشطة الدرس.",
      },
      {
        status: 500,
      }
    );
  }
}
