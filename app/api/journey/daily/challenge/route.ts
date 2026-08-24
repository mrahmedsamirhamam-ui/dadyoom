import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  getBahrainDate,
} from "@/features/gamification/daily-challenge-server";

const validSkills =
  new Set([
    "reading",
    "writing",
    "listening",
    "speaking",
  ]);

export async function GET() {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
      error: authError,
    } =
      await supabase
        .auth
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

    const today =
      getBahrainDate();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "student_daily_challenges"
        )
        .select(`
          challenge_id,
          skill,
          title,
          target_score,
          status,
          achieved_score,
          bonus_xp,
          bonus_awarded,
          accepted_at,
          completed_at
        `)
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "challenge_date",
          today
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      challenge:
        data ?? null,
    });
  }
  catch (error) {
    console.error(
      "DAILY_CHALLENGE_STATUS_FAILED:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "تعذر تحميل حالة تحدي اليوم.",
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
      await supabase
        .auth
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

    const body =
      await request.json();

    const challengeId =
      typeof body.challengeId ===
        "string"
        ? body.challengeId.trim()
        : "";

    const skill =
      typeof body.skill ===
        "string"
        ? body.skill.trim()
        : "";

    const title =
      typeof body.title ===
        "string"
        ? body.title.trim()
        : "";

    const targetScore =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            Number(
              body.targetScore
            ) || 0
          )
        )
      );

    if (
      !challengeId ||
      !title ||
      !validSkills.has(skill)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "بيانات التحدي غير صحيحة.",
        },
        {
          status: 400,
        }
      );
    }

    const today =
      getBahrainDate();

    const {
      data: existing,
      error: existingError,
    } =
      await supabase
        .from(
          "student_daily_challenges"
        )
        .select(`
          challenge_id,
          status,
          achieved_score,
          bonus_xp,
          bonus_awarded
        `)
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "challenge_date",
          today
        )
        .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyAccepted: true,
        challenge:
          existing,
      });
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "student_daily_challenges"
        )
        .insert({
          user_id:
            user.id,

          challenge_date:
            today,

          skill,

          challenge_id:
            challengeId,

          title,

          target_score:
            targetScore,

          status:
            "accepted",

          bonus_xp:
            0,

          bonus_awarded:
            false,
        })
        .select(`
          challenge_id,
          skill,
          title,
          target_score,
          status,
          achieved_score,
          bonus_xp,
          bonus_awarded
        `)
        .single();

    if (error) {

      if (
        error.code ===
        "23505"
      ) {
        return NextResponse.json({
          ok: true,
          alreadyAccepted: true,
        });
      }

      throw error;
    }

    return NextResponse.json({
      ok: true,
      alreadyAccepted: false,
      challenge:
        data,
    });
  }
  catch (error) {
    console.error(
      "DAILY_CHALLENGE_ACCEPT_FAILED:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "تعذر قبول تحدي اليوم.",
      },
      {
        status: 500,
      }
    );
  }
}
