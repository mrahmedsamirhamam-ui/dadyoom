import { NextResponse } from "next/server";

import { currentPlan } from "@/lib/billing/access";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type GameItem = {
  prompt: string;
  options?: string[];
  answer: string | boolean;
};

type GamePack = {
  quiz: GameItem[];
  trueFalse: GameItem[];
  match: GameItem[];
  order: GameItem[];
  treasure: GameItem[];
  challenge: GameItem[];
};

type VocabularyRow = { word: string; meaning: string };
const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

/**
 * Legacy arcade modes are ungraded vocabulary activities, NOT academic
 * question attempts. Do not read the questions table or expose stored
 * MCQ correct_answer fields in a downloadable game pack.
 *
 * New graded quizzes must use /lessons/[id]/play and trusted server grading.
 */
export function buildVocabularyGamePack(rows: VocabularyRow[]): GamePack | null {
  const words = rows.filter(
    (item) => typeof item.word === "string" &&
      typeof item.meaning === "string" &&
      item.word.trim().length > 0 &&
      item.meaning.trim().length > 0,
  ).map((item) => ({
    word: item.word.trim(),
    meaning: item.meaning.trim(),
  }));

  const meanings = Array.from(new Set(words.map((item) => item.meaning)));
  if (meanings.length < 2) return null;

  const unique = Array.from(new Map(words.map((item) => [item.word, item])).values());
  if (unique.length < 2) return null;

  // Never pad a short bank with duplicate or invented questions.
  const seed = unique.slice(0, 5).map((row): GameItem => {
    const options = [
      row.meaning,
      ...meanings.filter((meaning) => meaning !== row.meaning).slice(0, 3),
    ];

    return {
      prompt: `اختر معنى الكلمة: ${row.word}`,
      options,
      answer: row.meaning,
    };
  });

  const trueFalse = seed.map((item, index): GameItem => {
    const options = item.options ?? [];
    const trueAnswer = String(item.answer);
    const falseAnswer = options.find((value) => value !== trueAnswer);

    return {
      prompt: `هل معنى "${item.prompt.replace("اختر معنى الكلمة: ", "")}" هو "${index % 2 === 0 ? trueAnswer : falseAnswer ?? trueAnswer}"؟`,
      answer: index % 2 === 0 || !falseAnswer,
    };
  });

  return {
    quiz: seed,
    trueFalse,
    match: seed,
    order: seed.map((item) => ({
      ...item,
      prompt: `سباق الكلمات: ${item.prompt}`,
    })),
    treasure: seed.map((item) => ({
      ...item,
      prompt: `كنز المفردات: ${item.prompt}`,
    })),
    challenge: [...seed].reverse().map((item) => ({
      ...item,
      prompt: `تحدي سريع: ${item.prompt}`,
    })),
  };
}

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
