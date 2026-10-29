import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Lesson = {
  id: string;
  grade: number;
  summary: string;
  content: string;
  learningObjectives: string[];
  vocabulary: { word: string; meaning: string }[];
  instructions: string[];
  questions: { order: number; question: string; options: { id: string; text: string }[] }[];
  activities: { order: number; title: string; prompt: string; activityType: string; options?: string[] }[];
};
const raw = readFileSync(resolve(process.cwd(),
  "data/curriculum-drafts/bahrain-grade1-3-sukun-real-original-lessons-20261029.json"), "utf8");
const pack = JSON.parse(raw) as {
  containsAnswerKeys: boolean; country: string; lessons: Lesson[];
};
describe("Bahrain Grade 1–3 graded sukun lesson repairs", () => {
  it("preserves exactly the three previously published lesson IDs and distinct grade levels", () => {
    expect(pack.country).toBe("BH");
    expect(pack.lessons.map(l => l.grade)).toEqual([1, 2, 3]);
    expect(pack.lessons.map(l => l.id)).toEqual([
      "8e2deb65-efbd-44aa-8861-48bd8005acdc",
      "adfeb112-5f69-4fbd-af17-9eea59c6ddac",
      "3bbdb44e-f256-4ec6-9cde-0f1eccda3857",
    ]);
  });
  it("uses three observable Bloom-aligned objectives and real grade-specific lesson teaching", () => {
    expect(new Set(pack.lessons.map(l => l.content)).size).toBe(3);
    for (const lesson of pack.lessons) {
      expect(lesson.content.length).toBeGreaterThan(1200);
      expect(lesson.content).toContain("السكون");
      expect(lesson.content).toContain("الدعم");
      expect(lesson.content).toContain("التقويم");
      expect(lesson.learningObjectives).toHaveLength(3);
      expect(lesson.learningObjectives.every(o => o.startsWith("أن "))).toBe(true);
      expect(lesson.vocabulary).toHaveLength(3);
      expect(lesson.instructions).toHaveLength(3);
      expect(lesson.activities.map(a => a.order)).toEqual([1, 2, 3]);
      expect(lesson.activities.map(a => a.activityType)).toEqual([
        "multiple_choice", "multiple_choice", lesson.grade === 1 ? "reading" : "writing",
      ]);
      expect(lesson.activities.every(a => !/ما المهارة الرئيسة|أي اختيار يطبّق ما تعلمته/u.test(a.prompt))).toBe(true);
    }
    expect(pack.lessons[0].content).toContain("مِنْ");
    expect(pack.lessons[1].content).toContain("مَكْتَبٌ");
    expect(pack.lessons[2].content).toContain("مَسْجِدٌ");
  });
  it("checks all ten replaced questions use meaningful phonics and distinct public choices", () => {
    expect(pack.lessons.map(l => l.questions.length)).toEqual([2, 4, 4]);
    for (const lesson of pack.lessons) {
      expect(new Set(lesson.questions.map(q => q.order)).size).toBe(lesson.questions.length);
      for (const question of lesson.questions) {
        expect(question.options.map(o => o.id)).toEqual(["a", "b", "c"]);
        expect(new Set(question.options.map(o => o.text)).size).toBe(3);
        expect(question.question).not.toMatch(/ما المهارة الرئيسة|أي تطبيق يساعدك|ما الخطوة الأفضل|كيف تتحقق/u);
      }
    }
  });
  it("never stores private answer keys, answer explanations or student records in the public draft", () => {
    expect(pack.containsAnswerKeys).toBe(false);
    expect(raw).not.toMatch(/"correct_answer"\s*:|"correctAnswer"\s*:|"model_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:/u);
    expect(raw).not.toMatch(/"student_id"\s*:|"student_email"\s*:/u);
  });
});
