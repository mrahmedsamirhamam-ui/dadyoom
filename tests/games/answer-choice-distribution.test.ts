import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { sourceForAutomaticGameQuestions } from "../../lib/games/lesson-question-source";
import {
  GAME_MODES,
  buildLessonGamePack,
  distributeGameAnswerPositions,
  type GamePack,
} from "../../lib/games/lesson-game-pack";

function firstAnswerPack(): GamePack {
  return Object.fromEntries(GAME_MODES.map(mode => [
    mode,
    Array.from({ length: 5 }, (_, index) => ({
      prompt: `ما الإجابة الصحيحة للسؤال ${index + 1} في ${mode}؟`,
      options: ["الإجابة الصحيحة", "مشتت أول", "مشتت ثانٍ", "مشتت ثالث"],
      answer: "الإجابة الصحيحة",
    })),
  ])) as GamePack;
}

describe("HTML5 arcade option presentation", () => {
  test("distributes the right choice across different lanes while preserving the answer", () => {
    const source = firstAnswerPack();
    const result = distributeGameAnswerPositions(source);

    for (const mode of GAME_MODES) {
      const answerPositions = result[mode].map(item => item.options.indexOf(item.answer));
      expect(new Set(answerPositions).size).toBe(4);
      for (let stage = 0; stage < 5; stage += 1) {
        const before = source[mode][stage];
        const after = result[mode][stage];
        expect(after.answer).toBe(before.answer);
        expect(after.prompt).toBe(before.prompt);
        expect([...after.options].sort()).toEqual([...before.options].sort());
        expect(after.options.filter(choice => choice === after.answer)).toHaveLength(1);
      }
    }
  });

  test("does not mutate approved question packs and is deterministic", () => {
    const source = firstAnswerPack();
    const snapshot = JSON.stringify(source);
    const once = distributeGameAnswerPositions(source);
    const twice = distributeGameAnswerPositions(source);
    expect(once).toEqual(twice);
    expect(JSON.stringify(source)).toBe(snapshot);
  });

  test("supports valid two-choice questions without dropping the correct choice", () => {
    const source = firstAnswerPack();
    for (const mode of GAME_MODES) {
      source[mode] = source[mode].map(item => ({
        ...item,
        options: ["الإجابة الصحيحة", "الإجابة الخاطئة"],
      }));
    }
    const result = distributeGameAnswerPositions(source);
    for (const mode of GAME_MODES) {
      const answerPositions = result[mode].map(item => item.options.indexOf(item.answer));
      expect(new Set(answerPositions).size).toBe(2);
    }
  });
});


describe("game HTTP delivery safety", () => {
  const api = readFileSync("app/api/lessons/games/route.ts", "utf8");
  test("balances both approved and lesson-derived packs", () => {
    expect(api).toContain("pack: distributeGameAnswerPositions(pack)");
    expect(api).toContain("pack: distributeGameAnswerPositions(result.pack)");
  });
  test("transient lesson or question bank failures cannot become a false 404 or empty pack", () => {
    expect(api).toContain("if (lessonResult.error) {");
    expect(api).toContain("if (q.error || v.error) {");
    expect(api).toContain('status: 503, headers');
    expect(api).toContain('code: "LESSON_GAME_BANK_NEEDS_CONTENT"');
  });
});

describe("game client recovery", () => {
  const ui = readFileSync("app/lessons/[id]/games/LessonHTMLArcade.tsx", "utf8");
  test("temporary HTTP or network failures offer an explicit retry", () => {
    expect(ui).toContain("setRetryAttempt(n => n + 1)");
    expect(ui).toContain("setRetryable(mayRetry)");
    expect(ui).toContain("response.status === 429 || response.status >= 500");
    expect(ui).toContain("[lesson.id, retryAttempt]");
  });
  test("does not encourage repeated retries when the lesson has no reviewed question bank", () => {
    expect(ui).toContain("setRetryable(false)");
    expect(ui).toContain("!pack && !loading && message");
    expect(ui).toContain("disabled={!pack}");
    expect(ui).toContain("if (!pack) return;");
  });
});

describe("real lesson question bank partition", () => {
  for (const size of [5, 6, 7, 10, 15, 20, 25]) {
    test(`bank size ${size}: every mode gets five different actual questions`, () => {
      const questions = Array.from({ length: size }, (_, i) => ({
        question: `اختر الإجابة المناسبة للسؤال رقم ${i + 1} في الدرس`,
        options: ["الإجابة المناسبة", "إجابة أخرى"],
        correct_answer: "a",
      }));
      const result = buildLessonGamePack("درس عربي", "", questions, []);
      expect(result.bankSize).toBe(size);
      expect(result.pack).not.toBeNull();
      const pack = result.pack!;
      for (const mode of GAME_MODES) {
        expect(pack[mode]).toHaveLength(5);
        expect(new Set(pack[mode].map(item => item.prompt)).size).toBe(5);
        expect(pack[mode].every(item => item.options.includes(item.answer))).toBe(true);
      }
      if (size === 25) {
        expect(new Set(GAME_MODES.flatMap(mode => pack[mode].map(item => item.prompt))).size).toBe(25);
      }
    });
  }

  test("a lesson with fewer than five usable questions stays unavailable", () => {
    const questions = Array.from({ length: 4 }, (_, i) => ({
      question: `اختبار قصير لمعرفة السؤال رقم ${i + 1}`,
      options: ["صحيح", "خطأ"],
      correct_answer: "a",
    }));
    const result = buildLessonGamePack("درس عربي", "", questions, []);
    expect(result.pack).toBeNull();
    expect(result.bankSize).toBe(4);
  });
});

describe("provenance gate for automatically generated game questions", () => {
  test("unresolved OCR cannot become source-generated answers", () => {
    expect(sourceForAutomaticGameQuestions({
      content: "مدخل OCR غير محسوم: هذا المحتوى يحتاج مراجعة المصدر الرسمي.",
      summary: "قراءة الصف الثاني",
    })).toBe("");
  });

  test("general imported boilerplate and curriculum scope nodes are excluded", () => {
    expect(sourceForAutomaticGameQuestions({
      content: "يتناول هذا الدرس موضوع «القراءة» بمقدمة آلية.",
    })).toBe("");
    expect(sourceForAutomaticGameQuestions({
      content: "هذا المحتوى من إنشاء ضاديوم لتغطية مجال القراءة فقط.",
    })).toBe("");
  });

  test("authored lesson content is preserved without claiming ministry approval", () => {
    const content = "درس ضاديوم الأصلي: تدريبات القراءة وتحديد الفكرة الرئيسة للنص.";
    expect(sourceForAutomaticGameQuestions({
      content, summary: "إثراء أصلي",
    })).toBe(content);
  });

  test("Bahrain lesson games exclude editorial metadata and use the learning section", () => {
    const content = [
      "ضاديوم — درس إثرائي أصلي للصف الثامن، الفصل الدراسي الثاني.",
      "حالة المصدر: غير مكتمل، الخطة 2025–2026 تاريخية.",
      "مسار التعلم الذاتي — مراجعة علمية وتطبيق عملي من ضاديوم",
      "التوكيد اللفظي تكرار اللفظ لأجل توضيح المعنى وتأكيده في الكلام.",
      "جاء الطالبُ نفسُهُ: التوكيد معنوي والاسم تابع للمؤكَّد في الإعراب.",
    ].join("\\n");
    const safe = sourceForAutomaticGameQuestions({ content });
    expect(safe).not.toContain("الفصل الدراسي الثاني");
    expect(safe).not.toContain("حالة المصدر");
    expect(safe).toContain("التوكيد اللفظي");
  });

  test("empty lesson material cannot produce fake generated prompts", () => {
    expect(sourceForAutomaticGameQuestions({ content: "   " })).toBe("");
  });

  test("endpoint preserves linked questions when source prose is restricted", () => {
    const route = readFileSync("app/api/lessons/games/route.ts", "utf8");
    expect(route).toContain("sourceForAutomaticGameQuestions({");
    expect(route).toContain("contentForExercises,");
    expect(route).toContain("(q.data ?? []) as QuestionRow[]");
    expect(route).toContain("(v.data ?? []) as VocabularyRow[]");
  });
});

describe("lesson games write-endpoint resilience", () => {
  test("game-pack approvals do not mistake database outages for a deleted lesson", () => {
    const route = readFileSync("app/api/lessons/games/route.ts", "utf8");
    expect(route).toContain("if (exists.error) {");
    expect(route).toContain("GAME_PACK_APPROVAL_LESSON_LOOKUP_FAILED");
    expect(route).toContain('status: 503, headers');
  });

  test("score recording distinguishes unavailable DB from truly missing lessons", () => {
    const route = readFileSync("app/api/games/complete/route.ts", "utf8");
    expect(route).toContain("if (exists.error) {");
    expect(route).toContain("GAME_SCORE_LESSON_LOOKUP_FAILED");
    expect(route).toContain('status: 503');
    expect(route).toContain("if (!exists.data) {");
  });
});

describe("accurate provenance for generated game prompts", () => {
  test("duplicate saved questions cannot hide newly generated excerpt exercises", () => {
    const repeated = Array.from({ length: 35 }, () => ({
      question: "ما الفائدة المهمة التي تقدمها القراءة للإنسان؟",
      options: ["تنمية الفهم", "إهمال المعرفة"],
      correct_answer: "a",
    }));
    const lessonContent = [
      "يقرأ الطلاب القصص الممتعة في المكتبة ويستخرجون معاني الكلمات الجميلة من النصوص.",
      "تساعد القراءة المستمرة على تنمية الخيال والفهم والقدرة على التعبير والتواصل مع الآخرين.",
      "يناقش المعلم مع المتعلمين الفكرة الرئيسة ويطلب منهم اختيار الأدلة الصحيحة من الفقرات.",
    ].join("\n");
    const result = buildLessonGamePack("مهارات القراءة", lessonContent, repeated, []);
    expect(result.pack).not.toBeNull();
    expect(result.bankSize).toBeGreaterThanOrEqual(5);
    expect(result.generated).toBeGreaterThan(0);
    expect(result.pack!.maze.some(item =>
      item.prompt.startsWith("أكمل الكلمة الناقصة"))).toBe(true);
  });

  test("linked questions without text exercises do not trigger a generated-source warning", () => {
    const questions = Array.from({ length: 5 }, (_, index) => ({
      question: `ما السؤال الصحيح رقم ${index + 1} من الدرس؟`,
      options: ["الاختيار الأول", "الاختيار الثاني"],
      correct_answer: "a",
    }));
    const result = buildLessonGamePack("مهارات القراءة", "", questions, []);
    expect(result.pack).not.toBeNull();
    expect(result.generated).toBe(0);
  });
});
