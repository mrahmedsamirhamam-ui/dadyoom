import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { questionsFromPublishedActivities } from "../../lib/games/published-activity-questions";
import { buildLessonGamePack } from "../../lib/games/lesson-game-pack";

const make = (overrides: Record<string, unknown> = {}) => ({
  prompt: "أي العبـارات تساعد الطالب على فهم معنى الكلمات؟",
  content: { options: ["أقرأ النص وأحدد المعنى", "أتجاهل الشرح", "أترك الواجب"] },
  answer: { correct: "أقرأ النص وأحدد المعنى" },
  ...overrides,
});

describe("reuse existing published educational activities safely", () => {
  test("maps a published multiple-choice activity without altering the original data", () => {
    const source = make();
    const snapshot = JSON.stringify(source);
    const converted = questionsFromPublishedActivities([source]);
    expect(converted).toEqual([{
      question: source.prompt,
      options: (source.content as { options: string[] }).options,
      correct_answer: "أقرأ النص وأحدد المعنى",
    }]);
    expect(JSON.stringify(source)).toBe(snapshot);
  });

  test("does not include OCR, teacher or source-verification pending activities", () => {
    const flags = [
      { reviewStatus: "required" }, { reviewStatus: "pending" },
      { ocrReview: "pending" }, { sourceVerification: "pending" },
      { requiresOCRTitleReview: true },
    ];
    for (const flag of flags) {
      const source = make({ content: { options: ["أقرأ النص وأحدد المعنى", "أتجاهل الشرح"], ...flag } });
      expect(questionsFromPublishedActivities([source])).toEqual([]);
    }
  });

  test("rejects absent, ambiguous, duplicate or oversized choices", () => {
    expect(questionsFromPublishedActivities([
      make({ answer: { correct: "إجابة غير موجودة" } }),
      make({ answer: { correct: ["أقرأ النص وأحدد المعنى"] } }),
      make({ content: { options: ["أقرأ النص وأحدد المعنى", "أقرأ النص وأحدد المعنى"] } }),
      make({ content: { options: ["أقرأ النص وأحدد المعنى"] } }),
      make({ content: { options: ["أقرأ النص وأحدد المعنى", "س".repeat(121)] } }),
      make({ prompt: "قصير" }),
    ])).toHaveLength(0);
  });

  test("deduplicates repeated prompts without inventing extra game stages", () => {
    const converted = questionsFromPublishedActivities([make(), make()]);
    expect(converted).toHaveLength(1);
    const game = buildLessonGamePack("درس القراءة", "", converted, []);
    expect(game.pack).toBeNull();
    expect(game.bankSize).toBe(1);
  });

  test("published activity reuse is explicitly filtered at the database boundary", () => {
    const api = readFileSync("app/api/lessons/games/route.ts", "utf8");
    expect(api).toContain('db.from("lesson_activities")');
    expect(api).toContain('.eq("is_published", true)');
    expect(api).toContain('.eq("activity_type", "multiple_choice")');
    expect(api).toContain('questionsFromPublishedActivities(');
    expect(api).toContain("...publishedActivityQuestions,");
    expect(api).toContain("لا يُعد وجودها إثباتًا لمطابقة الكتاب الوزاري");
  });

  test("the lesson must remain published and unpublished activities cannot leak", () => {
    const api = readFileSync("app/api/lessons/games/route.ts", "utf8");
    expect(api).toContain('.eq("status", "published").maybeSingle()');
    expect(api).toContain('LESSON_GAME_ACTIVITIES_UNAVAILABLE');
  });
});
