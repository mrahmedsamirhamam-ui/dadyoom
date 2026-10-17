import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { GAME_MODES } from "@/lib/games/lesson-game-pack";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "طلب غير مصرح به." }, { status: 403 });
  }
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "سجل الدخول لحفظ نتيجتك." }, { status: 401 });
  }
  let body: { lessonId?: unknown; gameKey?: unknown; score?: unknown; maxScore?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "البيانات غير صحيحة." }, { status: 400 }); }

  const id = typeof body.lessonId === "string" ? body.lessonId : "";
  const gameKey = body.gameKey;
  const score = Number(body.score);
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id) ||
    !GAME_MODES.some(mode => mode === gameKey) ||
    Number(body.maxScore) !== 5 ||
    !Number.isInteger(score) || score < 0 || score > 5) {
    return NextResponse.json({ error: "محاولة اللعبة غير صالحة." }, { status: 400 });
  }
  const exists = await supabase.from("lessons")
    .select("id").eq("id", id).eq("status", "published").maybeSingle();
  if (exists.error || !exists.data) {
    return NextResponse.json({ error: "الدرس غير متاح." }, { status: 404 });
  }
  // These are motivational points only, never official assessment results.
  const xp = Math.min(30, Math.max(2, Math.round((score / 5) * 25) + 5));
  const saved = await db.from("edu_game_attempts").insert({
    student_id: user.id, lesson_id: id, game_key: gameKey,
    score, max_score: 5, xp_earned: xp,
  });
  if (saved.error) {
    console.error("LESSON_GAME_SCORE_SAVE_FAILED", saved.error.code);
    return NextResponse.json({ error: "تعذر حفظ النقاط." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, xp }, { headers: { "Cache-Control": "no-store" } });
}
