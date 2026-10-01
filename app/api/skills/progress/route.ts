import type { SupabaseClient } from "@supabase/supabase-js";
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

function bahrainDate(
  date = new Date()
): string {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Bahrain",
        year:
          "numeric",
        month:
          "2-digit",
        day:
          "2-digit",
      }
    )
      .formatToParts(
        date
      );

  const year =
    parts.find(
      part =>
        part.type === "year"
    )?.value;

  const month =
    parts.find(
      part =>
        part.type === "month"
    )?.value;

  const day =
    parts.find(
      part =>
        part.type === "day"
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    return date
      .toISOString()
      .slice(0, 10);
  }

  return `${year}-${month}-${day}`;
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

    const db =
      supabase as unknown as SupabaseClient;

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

    const [
      challengeResult,
      streakResult,
    ] = await Promise.all([
      db.rpc(
        "complete_daily_challenge_light",
        {
          p_skill: typedSkill,
          p_score: score,
        },
      ),
      user.email?.trim()
        ? db.rpc(
            "update_student_streak",
            {
              p_student_email:
                user.email.trim(),
              p_activity_date:
                bahrainDate(),
            },
          )
        : Promise.resolve({
            data: null,
            error: null,
          }),
    ]);

    if (challengeResult.error) {
      console.warn(
        "SKILLS_PROGRESS_DAILY_CHALLENGE_LIGHT_WARNING:",
        challengeResult.error,
      );
    }

    if (streakResult.error) {
      console.warn(
        "SKILLS_PROGRESS_STREAK_LIGHT_WARNING:",
        streakResult.error,
      );
    }

    const challengeSync =
      challengeResult.data;

    return NextResponse.json({
      ok: true,
      dailyChallenge:
        Array.isArray(challengeSync)
          ? challengeSync[0] ?? null
          : challengeSync ?? null,

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
