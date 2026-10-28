import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => JSON.parse(
  readFileSync(resolve(process.cwd(), path), "utf8")
);

type Question = { order: number; question: string; options: { id: string; text: string }[] };
type Lesson = {
  id: string; code: string; country: string; grade: number; title: string;
  storyTitle: string; story: string; content: string; summary: string;
  learningObjectives: string[]; vocabulary: { word: string; meaning: string }[];
  questions: Question[]; openInstructions: string;
};
const commonPath="data/curriculum-drafts/grade1-21-arab-countries-original-short-reading-20261028.json";
const bahrainPath="data/curriculum-drafts/bh-grade1-original-short-reading-20261028.json";
const legacy = read(commonPath) as {countries:Lesson[]};
const bahrain = read(bahrainPath) as Lesson;
const lessons = [...legacy.countries, bahrain];

describe("Grade-1 original short-reading specificity across all 22 countries", () => {
  it("covers exactly 22 distinct country lessons with no repeated identifiers", () => {
    expect(legacy.countries).toHaveLength(21);
    expect(lessons).toHaveLength(22);
    expect(new Set(lessons.map(l=>l.id)).size).toBe(22);
    const expected="AE BH DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");
    expect(lessons.map(l=>l.code).sort()).toEqual(expected.sort());
  });

  it("has 22 original story passages, objectives and differentiated activities", () => {
    expect(new Set(lessons.map(l=>l.story)).size).toBe(22);
    for (const lesson of lessons) {
      expect(lesson.grade).toBe(1);
      expect(lesson.title).toBe("قراءة نص قصير");
      expect(lesson.story.length).toBeGreaterThan(90);
      expect(lesson.content).toContain(lesson.story);
      expect(lesson.content).toContain(lesson.storyTitle);
      expect(lesson.content).toContain("نشاط الدعم:");
      expect(lesson.content).toContain("نشاط التطبيق:");
      expect(lesson.content).toContain("نشاط التحدي:");
      expect(lesson.content).toMatch(/وزاري|الوزارة/u);
      expect(lesson.learningObjectives).toHaveLength(3);
      expect(lesson.learningObjectives.every(x=>x.startsWith("أن "))).toBe(true);
      expect(lesson.vocabulary).toHaveLength(3);
      expect(lesson.vocabulary.every(x=>x.word.length>1&&x.meaning.length>9)).toBe(true);
    }
  });

  it("authors five different specific questions per lesson with three unique answer options", () => {
    let count=0;
    for (const lesson of lessons) {
      expect(lesson.questions).toHaveLength(5);
      expect(lesson.questions.map(q=>q.order)).toEqual([1,2,3,4,5]);
      expect(new Set(lesson.questions.map(q=>q.question)).size).toBe(5);
      for (const q of lesson.questions) {
        count++;
        expect(q.question.length).toBeGreaterThan(12);
        expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
        expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
        expect(q.question).not.toMatch(/المهارة الرئيسة التي يتدرب عليها|كيف تتحقق من إتقان المهارة|أي تطبيق يساعدك على إتقان درس|ما الخطوة الأفضل بعد فهم مثال درس/u);
      }
    }
    expect(count).toBe(110);
  });

  it("does not commit database answer keys or teacher grading explanations into the public draft", () => {
    const allText = [
      readFileSync(resolve(process.cwd(), commonPath), "utf8"),
      readFileSync(resolve(process.cwd(), bahrainPath), "utf8")
    ].join("\n");
    expect(allText).not.toMatch(/"correctAnswer"\s*:|"correct_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:/);
    expect(allText).not.toMatch(/\b(?:service_role|SUPABASE_SERVICE_ROLE_KEY)\b/);
  });
});
