import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  GAME_MODES,
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
