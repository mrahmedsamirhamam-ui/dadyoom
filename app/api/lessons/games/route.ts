import { NextResponse } from "next/server";

import { currentPlan } from "@/lib/billing/access";
import { createClient } from "@/lib/supabase/server";
import { buildVocabularyGamePack, type VocabularyRow } from "@/features/games/build-vocabulary-game-pack";

export const runtime = "nodejs";

const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "سجّل الدخول أولًا." }, { status: 401 });
    }

    const lessonId = new URL(request.url).searchParams.get("lessonId")?.trim();
    if (!lessonId || !UUID.test(lessonId)) {
      return NextResponse.json({ error: "معرّف الدرس غير صالح." }, { status: 400 });
    }

    // Lesson visibility must be verified before any content or cached pack.
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", lessonId)
      .eq("status", "published")
      .maybeSingle();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: "الدرس غير متاح." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("lesson_vocabulary")
      .select("word,meaning")
      .eq("lesson_id", lessonId)
      .order("display_order", { ascending: true })
      .limit(20);

    if (error) throw error;

    const pack = buildVocabularyGamePack((data ?? []) as VocabularyRow[]);
    if (!pack) {
      return NextResponse.json(
        { error: "تحتاج ألعاب المفردات إلى كلمتين مختلفتين موثقتين على الأقل في هذا الدرس. جرّب «ذاكر والعب» للاختبار المُصحّح." },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        pack,
        plan: await currentPlan(),
        freeModes: ["quiz", "trueFalse", "match"],
        plusModes: ["order", "treasure", "challenge"],
        cached: false,
        generator: "vocabulary-only-ungraded-v2",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "تعذر تجهيز ألعاب المفردات." },
      { status: 500 },
    );
  }
}
