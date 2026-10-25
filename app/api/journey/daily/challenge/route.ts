import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  getBahrainDate,
} from "@/features/gamification/daily-challenge-server";
import { resolveTrustedDailyChallenge } from "@/features/gamification/resolve-trusted-daily-challenge";

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

    const body: unknown =
      await request.json();
    const submitted =
      body && typeof body === "object" && !Array.isArray(body)
        ? body as Record<string, unknown>
        : {};
    const challengeId =
      typeof submitted.challengeId === "string"
        ? submitted.challengeId.trim()
        : "";

    if (!challengeId) {
      return NextResponse.json(
        { ok: false, error: "معرّف التحدي غير صالح." },
        { status: 400 },
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

    // The student does not get to set targetScore, skill, title or bonus.
    // Recalculate the daily recommendation from owner-scoped server data.
    const verifiedChallenge = await resolveTrustedDailyChallenge(
      supabase,
      user.id,
    );
    if (challengeId !== verifiedChallenge.id ||
      (submitted.skill !== undefined &&
        submitted.skill !== verifiedChallenge.skill) ||
      (submitted.title !== undefined &&
        submitted.title !== verifiedChallenge.title) ||
      (submitted.targetScore !== undefined &&
        submitted.targetScore !== verifiedChallenge.targetScore)) {
      return NextResponse.json(
        { ok: false, error: "تغيّر تحدي اليوم؛ حدّث الصفحة ثم حاول مجددًا." },
        { status: 409 },
      );
    }
    const { skill, title, targetScore } = verifiedChallenge;

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
