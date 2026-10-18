import { describe, expect, test } from "vitest";
import {
  approvedPack, buildLessonGamePack, GAME_MODES, type GamePack,
} from "../../lib/games/lesson-game-pack";

const question = (i: number) => ({
  question: `اختر الإجابة المناسبة للسؤال رقم ${i + 1} من هذا الدرس؟`,
  options: ["الإجابة الصحيحة", "خيار غير صحيح", "خيار إضافي"],
  correct_answer: "a",
});

describe("game answer safety for legacy imported questions", () => {
  test("a duplicate before the letter-coded answer must NOT change which option wins", () => {
    const ambiguous = {
      question: "أي من الخيارات التالية هو الإجابة الصحيحة للسؤال؟",
      // In raw data B is the second occurrence of "صحيح".
      // Deduping first incorrectly made B equal to "خطأ".
      options: ["صحيح", "صحيح", "خطأ"],
      correct_answer: "b",
    };
    const result = buildLessonGamePack(
      "درس في اللغة العربية", "",
      [...Array.from({ length: 4 }, (_, i) => question(i)), ambiguous],
      [],
    );
    expect(result.pack).toBeNull();
    expect(result.bankSize).toBe(4);
  });

  test("invalid or empty answer options are skipped rather than reindexed", () => {
    const result = buildLessonGamePack("درس اللغة", "", [
      ...Array.from({ length: 4 }, (_, i) => question(i)),
      {
        question: "ما المهارة المطلوبة في هذا الدرس الدراسي؟",
        options: ["إجابة واضحة", "", "إجابة أخرى"],
        correct_answer: "c",
      },
    ], []);
    expect(result.pack).toBeNull();
    expect(result.bankSize).toBe(4);
  });

  test("valid unique positional options still produce five working games", () => {
    const result = buildLessonGamePack("درس اللغة", "",
      Array.from({ length: 5 }, (_, i) => question(i)), []);
    expect(result.pack).not.toBeNull();
    for (const mode of GAME_MODES) {
      expect(result.pack![mode]).toHaveLength(5);
      expect(result.pack![mode].every(item => item.answer === "الإجابة الصحيحة")).toBe(true);
    }
  });

  test("an approved package cannot silently discard repeated source choices", () => {
    const valid = Object.fromEntries(GAME_MODES.map(mode => [
      mode, Array.from({ length: 5 }, (_, i) => ({
        prompt: `اختر الإجابة الصحيحة للسؤال المميز رقم ${i + 1} في ${mode}؟`,
        options: ["مناسب", "غير مناسب", "لا ينطبق"],
        answer: "مناسب",
      })),
    ])) as GamePack;
    expect(approvedPack(valid)).not.toBeNull();
    const altered = structuredClone(valid);
    altered.maze[0].options = ["مناسب", "مناسب", "غير مناسب"];
    expect(approvedPack(altered)).toBeNull();
  });
});
