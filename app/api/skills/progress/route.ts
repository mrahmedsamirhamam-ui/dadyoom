import { completeDailyChallengeFromSkillResult } from "@/features/gamification/daily-challenge-server";
import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

const allowedSkills = new Set([
  "reading",
  "writing",
  "listening",
  "speaking",
]);

type SkillName =
  | "reading"
  | "writing"
  | "listening"
  | "speaking";

function clampScore(
  value: unknown
): number {
  const n =
    Number(value);

  if (
    !Number.isFinite(n)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(n)
    )
  );
}

function levelFromScore(
  score: number
): string {
  if (score >= 90) {
    return "متقدم";
  }

  if (score >= 75) {
    return "جيد جدًا";
  }

  if (score >= 60) {
    return "جيد";
  }

  if (score >= 40) {
    return "نامٍ";
  }

  return "مبتدئ";
}

function xpFromScore(
  score: number
): number {
  if (score >= 90) {
    return 25;
  }

  if (score >= 75) {
    return 20;
  }

  if (score >= 60) {
    return 15;
  }

  if (score >= 40) {
    return 10;
  }

  return 5;
}

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

export async function POST(
  request: Request
) {
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

    const body =
      (await request.json()) as {
        skill?: unknown;
        score?: unknown;
      };

    const skill =
      typeof body.skill ===
        "string"
        ? body.skill.trim()
        : "";

    if (
      !allowedSkills.has(
        skill
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "المهارة غير صحيحة.",
        },
        {
          status: 400,
        }
      );
    }

    const typedSkill =
      skill as SkillName;

    const score =
      clampScore(
        body.score
      );

    const {
      data: existing,
      error:
        loadError,
    } =
      await supabase
        .from(
          "student_skill_progress"
        )
        .select(`
          best_score,
          latest_score,
          attempts,
          xp
        `)
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "skill",
          typedSkill
        )
        .maybeSingle();

    if (
      loadError &&
      loadError.code !==
        "PGRST116"
    ) {
      if (
        loadError.code ===
        "42P01"
      ) {
        return NextResponse.json(
          {
            ok: false,
            tableMissing: true,
            error:
              "جدول تقدم المهارات غير موجود بعد.",
          },
          {
            status: 409,
          }
        );
      }

      throw loadError;
    }

    const oldBest =
      Number(
        existing?.best_score ??
        0
      );

    const oldAttempts =
      Number(
        existing?.attempts ??
        0
      );

    const oldXp =
      Number(
        existing?.xp ??
        0
      );

    const bestScore =
      Math.max(
        oldBest,
        score
      );

    const gainedXp =
      xpFromScore(
        score
      );

    const payload = {
      user_id:
        user.id,

      skill:
        typedSkill,

      latest_score:
        score,

      best_score:
        bestScore,

      attempts:
        oldAttempts + 1,

      xp:
        oldXp +
        gainedXp,

      level:
        levelFromScore(
          bestScore
        ),

      updated_at:
        new Date()
          .toISOString(),
    };

    const {
      error:
        saveError,
    } =
      await supabase
        .from(
          "student_skill_progress"
        )
        .upsert(
          payload,
          {
            onConflict:
              "user_id,skill",
          }
        );

    if (saveError) {
      throw saveError;
    }

    const dailyChallenge =
      await completeDailyChallengeFromSkillResult({
        supabase,
        userId:
          user.id,
        userEmail:
          user.email,
        skill:
          typedSkill,
        score,
      });

    return NextResponse.json({
      dailyChallenge,
      ok: true,

      progress: {
        skill:
          typedSkill,

        latestScore:
          score,

        bestScore,

        attempts:
          oldAttempts + 1,

        gainedXp,

        xp:
          oldXp +
          gainedXp,

        level:
          levelFromScore(
            bestScore
          ),
      },
    });
  }
  catch (error) {
    console.error(
      "SKILLS_PROGRESS_POST_FAILED:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "تعذر حفظ تقدم المهارة.",
      },
      {
        status: 500,
      }
    );
  }
}
