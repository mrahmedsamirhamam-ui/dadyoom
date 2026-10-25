import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Learner-facing progress remains readable. The old POST path accepted a
 * browser-supplied 0-100 score, persisted academic XP, then awarded a daily
 * challenge bonus based on that unverified number. A signed-in session
 * authenticates the user, NOT the score.
 *
 * Trust-boundary release gate: only a server-graded, single-use, student-
 * bound assessment receipt may enable rewarded skill writes in a separate
 * reviewed endpoint. Existing practice pages keep local formative feedback.
 */

export async function GET() {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
      error: authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !user
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "student_skill_progress"
        )
        .select(`
          skill,
          best_score,
          latest_score,
          attempts,
          xp,
          level,
          updated_at
        `)
        .eq(
          "user_id",
          user.id
        );

    if (error) {
      if (
        error.code ===
        "42P01"
      ) {
        return NextResponse.json({
          ok: true,
          progress: [],
          tableMissing: true,
        });
      }

      throw error;
    }

    return NextResponse.json({
      ok: true,
      progress:
        data ?? [],
    });
  }
  catch (error) {
    console.error(
      "SKILLS_PROGRESS_GET_FAILED:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "تعذر تحميل تقدم المهارات.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول أولًا." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Ignore all client-provided scores/XP/skill names, even if a caller
  // replays a legacy request. Never write skill progress or award bonus XP.
  return NextResponse.json(
    {
      ok: false,
      code: "UNVERIFIED_SKILL_SCORE",
      error: "نتيجة التدريب للتمرين فقط؛ لا تُحفظ درجات المهارات أو XP حتى يتوفر تصحيح معتمد من الخادم.",
    },
    { status: 409, headers: { "Cache-Control": "no-store" } },
  );
}
