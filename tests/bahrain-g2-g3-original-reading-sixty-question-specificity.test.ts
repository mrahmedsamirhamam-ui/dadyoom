import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Question = { questionOrder: number; question: string; options: { id: string; text: string }[]; correctAnswer: string; explanation: string };
type Lesson = { lessonId: string; grade: number; title: string; sourceAnchor: string; questions: Question[] };
const pack = JSON.parse(readFileSync(resolve(process.cwd(),
  "data/curriculum-drafts/bh-grade2-3-s1-twenty-original-reading-sixty-question-repairs-2026.json"
), "utf8")) as { lessons: Lesson[]; expectedQuestionRows: number; preserveStableIds: boolean; requireZeroQuestionAttempts: boolean; requireZeroStudentProgress: boolean; publicationStatusUnchanged: boolean };

describe("Bahrain Grade 2-3 original reading comprehension quality", () => {
  it("uses 20 existing lessons and exactly 60 linked, non-duplicated questions", () => {
    expect(pack.lessons).toHaveLength(20);
    expect(pack.expectedQuestionRows).toBe(60);
    expect(pack.lessons.filter(l => l.grade === 2)).toHaveLength(10);
    expect(pack.lessons.filter(l => l.grade === 3)).toHaveLength(10);
    expect(new Set(pack.lessons.map(l => l.lessonId)).size).toBe(20);
    expect(pack.lessons.every(l => /^[a-f0-9-]{36}$/i.test(l.lessonId))).toBe(true);
    expect(pack.lessons.every(l => l.sourceAnchor.length >= 15)).toBe(true);
    expect(pack.lessons.every(l => l.questions.length === 3)).toBe(true);
    const questions = pack.lessons.flatMap(l => l.questions);
    expect(questions).toHaveLength(60);
    expect(new Set(questions.map(q => q.question)).size).toBe(60);
  });

  it("assesses facts, comprehension and decisions, not OCR titles or row numbers", () => {
    for (const lesson of pack.lessons) {
      expect(lesson.questions.map(q => q.questionOrder)).toEqual([1, 2, 3]);
      expect(lesson.questions.map(q => q.correctAnswer)).toEqual(["a", "b", "c"]);
      for (const question of lesson.questions) {
        expect(question.question.length).toBeGreaterThan(18);
        expect(question.explanation.length).toBeGreaterThan(15);
        expect(question.options).toHaveLength(3);
        expect(question.options.map(o => o.id)).toEqual(["a", "b", "c"]);
        expect(new Set(question.options.map(o => o.text)).size).toBe(3);
        expect(question.options.every(o => o.text.length > 2)).toBe(true);
        expect(question.options.some(o => o.id === question.correctAnswer)).toBe(true);
        expect(question.question).not.toMatch(/عنوان الدرس|الدرس رقم|يطابق الدرس|ما المهارة الرئيسة|إتقان المهارة/u);
      }
    }
  });

  it("requires no recorded attempts before a stable-ID update", () => {
    expect(pack.preserveStableIds).toBe(true);
    expect(pack.requireZeroQuestionAttempts).toBe(true);
    expect(pack.requireZeroStudentProgress).toBe(true);
    expect(pack.publicationStatusUnchanged).toBe(true);
  });
});
