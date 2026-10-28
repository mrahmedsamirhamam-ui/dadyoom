import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Option = { id: string; text: string };
type Question = { order: number; question: string; options: Option[] };
type Lesson = {
  id: string; code: string; country: string; grade: number; title: string;
  linkedReadingLessonId: string; linkedReadingTitle: string;
  sourceStory: string; content: string; summary: string;
  learningObjectives: string[]; vocabulary: { word: string; meaning: string }[];
  questions: Question[]; openInstructions: string;
};
const file = "data/curriculum-drafts/arab22-grades1-3-main-idea-linked-reading-66-lessons-20261028.json";
const raw = readFileSync(resolve(process.cwd(), file), "utf8");
const pack = JSON.parse(raw) as { countries: number; grades: number[]; publishedAnswerKeys: boolean; lessons: Lesson[] };
const lessons = pack.lessons;
const codes = "AE BH DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");

describe("Grade 1-3 main-idea comprehension anchored in original Dadyoom texts for 22 countries", () => {
  it("keeps 66 existing lesson IDs and 66 distinct existing reading references", () => {
    expect(pack.countries).toBe(22);
    expect(pack.grades).toEqual([1, 2, 3]);
    expect(lessons).toHaveLength(66);
    expect(new Set(lessons.map(l => l.id)).size).toBe(66);
    expect(new Set(lessons.map(l => l.linkedReadingLessonId)).size).toBe(66);
    expect([...new Set(lessons.map(l => l.code))].sort()).toEqual([...codes].sort());
    for (const code of codes) {
      expect(lessons.filter(l => l.code === code).map(l => l.grade).sort()).toEqual([1, 2, 3]);
    }
  });

  it("provides three measurable objectives and scaffolded original text-based practice", () => {
    for (const l of lessons) {
      expect(l.title).toBe("الفكرة الرئيسة");
      expect(l.sourceStory.length).toBeGreaterThan(75);
      expect(l.content).toContain(l.sourceStory);
      expect(l.content).toContain(l.linkedReadingLessonId);
      expect(l.content).toContain("نشاط الدعم:");
      expect(l.content).toContain("نشاط التطبيق:");
      expect(l.content).toContain("نشاط التحدي:");
      expect(l.content).toContain("ولا يزعم أنها نص مقرر من وزارة");
      expect(l.learningObjectives).toHaveLength(3);
      expect(l.learningObjectives.every(x => x.startsWith("أن "))).toBe(true);
      expect(l.vocabulary).toHaveLength(3);
      expect(l.vocabulary[0].word).toBe("الفكرة الرئيسة");
      expect(l.vocabulary[1].word).toBe("تفصيل داعم");
      expect(l.vocabulary.every(x => x.meaning.length >= 10)).toBe(true);
    }
  });

  it("provides 330 questions that distinguish overall ideas from source evidence and details", () => {
    let n = 0;
    for (const l of lessons) {
      expect(l.questions.map(x => x.order)).toEqual([1, 2, 3, 4, 5]);
      expect(new Set(l.questions.map(x => x.question)).size).toBe(5);
      expect(l.questions[0].question).toContain(l.linkedReadingTitle);
      expect(l.questions[1].question).toContain(l.linkedReadingTitle);
      expect(l.questions[2].question).toContain("تفصيلًا يدعم الفكرة");
      expect(l.questions[3].question).toContain("العنوان الأنسب");
      expect(l.questions[4].question).toContain(l.linkedReadingTitle);
      expect(l.questions[1].options.some(o => l.sourceStory.includes(o.text))).toBe(true);
      for (const q of l.questions) {
        n++;
        expect(q.options.map(o => o.id)).toEqual(["a", "b", "c"]);
        expect(new Set(q.options.map(o => o.text)).size).toBe(3);
        expect(q.question).not.toMatch(/ما المهارة الرئيسة التي يتدرب|كيف تتحقق من إتقان المهارة الأساسية|ما الخطوة الأفضل بعد فهم مثال درس|أي تطبيق يساعدك على إتقان درس/u);
      }
    }
    expect(n).toBe(330);
  });

  it("does not embed the answer keys or student-grading examples in the committed public JSON", () => {
    expect(pack.publishedAnswerKeys).toBe(false);
    expect(raw).not.toMatch(/"correctAnswer"\s*:|"correct_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:/);
    expect(raw).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|service_role/);
  });
});
