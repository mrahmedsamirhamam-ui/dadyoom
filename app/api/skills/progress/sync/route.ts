import { NextResponse } from "next/server";

import { completeDailyChallengeFromSkillResult } from "@/features/gamification/daily-challenge-server";
import { createClient } from "@/lib/supabase/server";
import { updateStreak } from "@/services/gamification/streak";

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

function clampScore(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      skill?: unknown;
      score?: unknown;
    };

    const skill =
      typeof body.skill === "string"
        ? body.skill.trim()
        : "";

    if (!allowedSkills.has(skill)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_SKILL" },
        { status: 400 },
      );
    }

    const typedSkill = skill as SkillName;
    const score = clampScore(body.score);

    let dailyChallenge: unknown = null;

    try {
      dailyChallenge =
        await completeDailyChallengeFromSkillResult({
          supabase,
          userId: user.id,
          userEmail: user.email,
          skill: typedSkill,
          score,
        });
    } catch (error) {
      console.warn(
        "SKILL_SECONDARY_DAILY_CHALLENGE_DEGRADED:",
        error,
      );
    }

    if (user.email?.trim()) {
      try {
        await updateStreak({
          supabase,
          studentEmail: user.email.trim(),
          activityDate: new Date(),
        });
      } catch (error) {
        console.warn(
          "SKILL_SECONDARY_STREAK_DEGRADED:",
          error,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      dailyChallenge,
    });
  } catch (error) {
    console.warn(
      "SKILL_SECONDARY_SYNC_DEGRADED:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        degraded: true,
      },
      { status: 200 },
    );
  }
}
