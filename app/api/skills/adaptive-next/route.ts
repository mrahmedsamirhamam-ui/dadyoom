import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  recommendAdaptiveSkill,
  type AdaptiveSkill,
  type SkillProgressInput,
} from "@/features/adaptive-skills/adaptive-skill-engine";

export async function GET() {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
      error: authError,
    } =
      await supabase.auth
        .getUser();

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
          latest_score,
          best_score,
          attempts,
          xp,
          level
        `)
        .eq(
          "user_id",
          user.id
        );

    if (error) {
      throw error;
    }

    const validSkills =
      new Set([
        "reading",
        "writing",
        "listening",
        "speaking",
      ]);

    const progress:
      SkillProgressInput[] =
      (data ?? [])
        .filter(
          row =>
            typeof row.skill ===
              "string" &&
            validSkills.has(
              row.skill
            )
        )
        .map(
          row => ({
            skill:
              row.skill as
                AdaptiveSkill,

            latest_score:
              Number(
                row.latest_score ??
                0
              ),

            best_score:
              Number(
                row.best_score ??
                0
              ),

            attempts:
              Number(
                row.attempts ??
                0
              ),

            xp:
              Number(
                row.xp ??
                0
              ),

            level:
              typeof row.level ===
                "string"
                ? row.level
                : "مبتدئ",
          })
        );

    const recommendation =
      recommendAdaptiveSkill(
        progress
      );

    return NextResponse.json({
      ok: true,
      recommendation,
      progress,
    });
  }
  catch (error) {
    console.error(
      "ADAPTIVE_SKILLS_FAILED:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "تعذر تحديد التدريب التالي.",
      },
      {
        status: 500,
      }
    );
  }
}
