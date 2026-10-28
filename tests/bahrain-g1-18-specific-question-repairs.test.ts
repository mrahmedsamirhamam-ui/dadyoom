import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Replacement = {
 expectedOldQuestion: string;
 question: string;
 options: Array<{ id: string; text: string }>;
 correctAnswer: string;
 explanation: string;
};
type Lesson = {
 lessonId: string;
 title: string;
 contentAnchor: string;
 replacements: Replacement[];
};
const pack = JSON.parse(readFileSync(
 resolve(process.cwd(), "data/curriculum-drafts/bh-grade1-core-18-lessons-36-specific-question-repairs-2026.json"),
 "utf8",
)) as { lessons: Lesson[]; questionsPerLesson: number; requireNoAttempts: boolean; requireNoLessonProgress: boolean };

describe("Bahrain Grade 1 basic-skills specificity", () => {
  it("updates only two generic prompts in each of 18 existing lesson records", () => {
    expect(pack.lessons).toHaveLength(18);
    expect(pack.questionsPerLesson).toBe(2);
    expect(new Set(pack.lessons.map(x => x.lessonId)).size).toBe(18);
    expect(new Set(pack.lessons.map(x => x.title)).size).toBe(18);
    expect(pack.requireNoAttempts).toBe(true);
    expect(pack.requireNoLessonProgress).toBe(true);
    for (const lesson of pack.lessons) {
      expect(lesson.lessonId).toMatch(/^[0-9a-f-]{36}$/i);
      expect(lesson.contentAnchor.startsWith("المهارة: ")).toBe(true);
      expect(lesson.replacements).toHaveLength(2);
      expect(lesson.replacements.map(x => x.expectedOldQuestion)).toEqual([
        "ما المهارة الرئيسة التي يتدرب عليها هذا الدرس؟",
        "كيف تتحقق من إتقان المهارة الأساسية في هذا الدرس؟",
      ]);
    }
  });

  it("contains 36 distinct, skill-linked questions and valid answer options", () => {
    const questions = pack.lessons.flatMap(x => x.replacements);
    expect(questions).toHaveLength(36);
    expect(new Set(questions.map(x => x.question)).size).toBe(36);
    for (const q of questions) {
      expect(q.question.length).toBeGreaterThan(18);
      expect(q.explanation.length).toBeGreaterThan(18);
      expect(q.question).not.toMatch(/المهارة الرئيسة التي يتدرب|كيف تتحقق من إتقان المهارة/u);
      expect(q.options.map(x => x.id)).toEqual(["a", "b", "c"]);
      expect(new Set(q.options.map(x => x.text)).size).toBe(3);
      expect(q.options.some(x => x.id === q.correctAnswer)).toBe(true);
    }
  });
});
