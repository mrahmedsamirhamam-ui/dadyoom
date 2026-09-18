import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "سجل الدخول أولًا." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    lessonId?: string;
    gameKey?: string;
    score?: number;
    maxScore?: number;
  };

  const maxScore = Math.max(
    1,
    Math.min(100, Math.round(Number(body.maxScore ?? 1))),
  );

  const score = Math.max(
    0,
    Math.min(maxScore, Math.round(Number(body.score ?? 0))),
  );

  const xp = Math.max(
    2,
    Math.min(
      30,
      Math.round((score / maxScore) * 25) + 5,
    ),
  );

  const { error } = await db
    .from("edu_game_attempts")
    .insert({
      student_id: user.id,
      lesson_id: body.lessonId || null,
      game_key: String(body.gameKey ?? "game").slice(0, 50),
      score,
      max_score: maxScore,
      xp_earned: xp,
    });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    xp,
  });
}
