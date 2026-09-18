import {
  createClient as createAdminClient,
} from "@supabase/supabase-js";
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

type QuestionRow = {
  question: string;
  question_type: string;
  options: unknown;
  correct_answer: string;
};

type VocabularyRow = {
  word: string;
  meaning: string;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) return null;

  return createAdminClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function optionStrings(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;

        return String(
          row.text ??
            row.label ??
            row.value ??
            row.option ??
            "",
        ).trim();
      }

      return String(item ?? "").trim();
    })
    .filter(Boolean);
}

function resolveAnswer(
  raw: string,
  options: string[],
) {
  const clean = String(raw ?? "").trim();

  if (!clean) {
    return options[0] ?? "";
  }

  if (options.includes(clean)) {
    return clean;
  }

  const numeric = Number(clean);

  if (
    Number.isInteger(numeric) &&
    numeric >= 0 &&
    numeric < options.length
  ) {
    return options[numeric] ?? clean;
  }

  const oneBased = numeric - 1;

  if (
    Number.isInteger(oneBased) &&
    oneBased >= 0 &&
    oneBased < options.length
  ) {
    return options[oneBased] ?? clean;
  }

  const letters = ["أ", "ب", "ج", "د"];

  const letterIndex = letters.indexOf(clean);

  if (letterIndex >= 0 && options[letterIndex]) {
    return options[letterIndex];
  }

  return clean;
}

function takeFive<T>(items: T[]) {
  if (!items.length) return [];

  return Array.from(
    { length: 5 },
    (_, index) => items[index % items.length],
  );
}

function buildPack(
  lessonTitle: string,
  questions: QuestionRow[],
  vocabulary: VocabularyRow[],
): GamePack {
  const quizSeed = questions
    .map((row): GameItem | null => {
      const options = optionStrings(row.options);

      if (options.length < 2) return null;

      const answer = resolveAnswer(
        row.correct_answer,
        options,
      );

      if (!answer) return null;

      return {
        prompt: row.question,
        options,
        answer,
      };
    })
    .filter(
      (item): item is GameItem =>
        item !== null,
    );

  const vocabularyOptions = Array.from(
    new Set(
      vocabulary
        .map((row) => row.meaning.trim())
        .filter(Boolean),
    ),
  );

  const matchSeed = vocabulary
    .filter(
      (row) =>
        row.word.trim() &&
        row.meaning.trim(),
    )
    .map((row): GameItem => {
      const extras = vocabularyOptions
        .filter(
          (meaning) =>
            meaning !== row.meaning,
        )
        .slice(0, 3);

      const options = Array.from(
        new Set([
          row.meaning,
          ...extras,
        ]),
      );

      return {
        prompt: `اختر معنى: ${row.word}`,
        options:
          options.length >= 2
            ? options
            : [
                row.meaning,
                "معنى آخر",
              ],
        answer: row.meaning,
      };
    });

  const source =
    quizSeed.length
      ? quizSeed
      : matchSeed.length
        ? matchSeed
        : [
            {
              prompt:
                `ما عنوان الدرس الذي تتعلمه الآن؟`,
              options: [
                lessonTitle,
                "درس آخر",
              ],
              answer: lessonTitle,
            },
          ];

  const quiz = takeFive(source);
  const match = takeFive(
    matchSeed.length
      ? matchSeed
      : source,
  );

  const trueFalse = takeFive(source).map(
    (item, index): GameItem => {
      const options =
        item.options ?? [];

      const correct =
        String(item.answer);

      const wrong =
        options.find(
          (option) =>
            option !== correct,
        ) ?? "إجابة أخرى";

      const statement =
        index % 2 === 0
          ? `الإجابة الصحيحة عن "${item.prompt}" هي: ${correct}`
          : `الإجابة الصحيحة عن "${item.prompt}" هي: ${wrong}`;

      return {
        prompt: statement,
        answer: index % 2 === 0,
      };
    },
  );

  const order = takeFive(source).map(
    (item): GameItem => ({
      prompt:
        `اختر الصياغة أو الإجابة الصحيحة: ${item.prompt}`,
      options: item.options,
      answer: item.answer,
    }),
  );

  const treasure = takeFive(
    matchSeed.length
      ? matchSeed
      : source,
  ).map(
    (item): GameItem => ({
      ...item,
      prompt:
        `كنز المفردات: ${item.prompt}`,
    }),
  );

  const challenge = takeFive(
    [...source].reverse(),
  ).map(
    (item): GameItem => ({
      ...item,
      prompt:
        `تحدي سريع: ${item.prompt}`,
    }),
  );

  return {
    quiz,
    trueFalse,
    match,
    order,
    treasure,
    challenge,
  };
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "سجل الدخول أولًا." },
        { status: 401 },
      );
    }

    const lessonId =
      new URL(request.url)
        .searchParams
        .get("lessonId")
        ?.trim();

    if (!lessonId) {
      return NextResponse.json(
        { error: "الدرس غير محدد." },
        { status: 400 },
      );
    }

    const plan = await currentPlan();
    const admin = adminClient();

    if (admin) {
      const { data: cached } =
        await admin
          .from("edu_lesson_game_packs")
          .select(
            "content,prompt_version",
          )
          .eq("lesson_id", lessonId)
          .maybeSingle();

      if (
        cached?.content &&
        cached.prompt_version ===
          "prebuilt-db-v1"
      ) {
        return NextResponse.json({
          pack: cached.content,
          plan,
          freeModes: [
            "quiz",
            "trueFalse",
            "match",
          ],
          plusModes: [
            "order",
            "treasure",
            "challenge",
          ],
          cached: true,
          generator:
            "prebuilt-db-v1",
        });
      }
    }

    const [
      lessonResult,
      questionsResult,
      vocabularyResult,
    ] = await Promise.all([
      supabase
        .from("lessons")
        .select("title")
        .eq("id", lessonId)
        .eq("status", "published")
        .maybeSingle(),
      supabase
        .from("questions")
        .select(
          "question,question_type,options,correct_answer",
        )
        .eq("lesson_id", lessonId)
        .order(
          "question_order",
          { ascending: true },
        )
        .limit(20),
      supabase
        .from("lesson_vocabulary")
        .select("word,meaning")
        .eq("lesson_id", lessonId)
        .order(
          "display_order",
          { ascending: true },
        )
        .limit(20),
    ]);

    if (
      lessonResult.error ||
      !lessonResult.data
    ) {
      return NextResponse.json(
        { error: "الدرس غير موجود." },
        { status: 404 },
      );
    }

    const pack = buildPack(
      String(lessonResult.data.title),
      (questionsResult.data ??
        []) as QuestionRow[],
      (vocabularyResult.data ??
        []) as VocabularyRow[],
    );

    if (admin) {
      await admin
        .from("edu_lesson_game_packs")
        .upsert(
          {
            lesson_id: lessonId,
            content: pack,
            provider:
              "prebuilt-database",
            model: null,
            prompt_version:
              "prebuilt-db-v1",
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "lesson_id",
          },
        );
    }

    return NextResponse.json({
      pack,
      plan,
      freeModes: [
        "quiz",
        "trueFalse",
        "match",
      ],
      plusModes: [
        "order",
        "treasure",
        "challenge",
      ],
      cached: false,
      generator: "prebuilt-db-v1",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر تجهيز الألعاب.",
      },
      { status: 500 },
    );
  }
}
