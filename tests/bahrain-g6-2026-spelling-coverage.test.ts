import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const load = (relative: string) => JSON.parse(readFileSync(resolve(process.cwd(), relative), "utf8"));
const source = load("data/curriculum-sources/bh-g6-s1-2026-ministry-plan-index.json");
const packs = [
  load("data/curriculum-drafts/bh-g6-s1-original-spelling-foundations.json"),
  load("data/curriculum-drafts/bh-g6-s1-original-spelling-applications.json"),
];
const lessons = packs.flatMap(pack => pack.practices);
const answers = (lesson: {
  questions: Array<{ correctAnswer: string; options: Array<{ id: string; text: string }> }>;
}) => lesson.questions.map(q => q.options.find(o => o.id === q.correctAnswer)?.text);

describe("Bahrain Grade-6 original spelling materials — full 13-topic source alignment", () => {
  it("authentically maps all thirteen first-term Ministry spelling headings without duplicates or writes", () => {
    expect(source.spellingTopics).toHaveLength(13);
    expect(lessons).toHaveLength(13);
    expect(lessons.reduce((sum, lesson) => sum + lesson.questions.length, 0)).toBe(52);
    const sorted = [...lessons].sort((a, b) => a.topicOrder - b.topicOrder);
    expect(sorted.map(l => l.topicOrder)).toEqual(Array.from({ length: 13 }, (_, i) => i + 1));
    expect(sorted.map(l => l.officialTopic)).toEqual(
      source.spellingTopics.map((entry: { title: string }) => entry.title),
    );
    expect(new Set(lessons.map(l => l.officialTopic)).size).toBe(13);
    for (const [i, l] of sorted.entries()) {
      const original = source.spellingTopics[i];
      expect(l.source.url).toBe(source.source.url);
      expect(l.source.book).toBe("التدريبات");
      expect(l.source.textbookPageStart).toBe(original.textbookPageStart);
      expect(l.source.textbookPageEnd).toBe(original.textbookPageEnd);
      expect(l.source.planPdfPage).toBe(original.planPdfPage);
      expect(l.source.visualTableVerification).toBe("pending");
      expect(l.status).toBe("original_g6_spelling_teacher_review_pending");
      expect(l.publicationApproved).toBe(false);
    }
  });

  it("contains substantial original instruction, dictation, differentiation and 52 valid explained assessments", () => {
    const counts = { a: 0, b: 0, c: 0 };
    const dictations = new Set<string>();
    for (const lesson of lessons) {
      expect(lesson.content.length).toBeGreaterThanOrEqual(1100);
      expect(lesson.content).toContain("ضاديوم");
      expect(lesson.content).toContain("تقييم تكويني");
      expect(lesson.content).not.toContain("يتناول هذا الدرس موضوع");
      expect(lesson.examples).toHaveLength(3);
      expect(lesson.objectives).toHaveLength(4);
      expect(lesson.differentiation.support).toContain("بطاقات");
      expect(lesson.differentiation.extension).toContain("مقارنة");
      expect(lesson.dictationPrompt.length).toBeGreaterThan(25);
      dictations.add(lesson.dictationPrompt);
      expect(lesson.questions).toHaveLength(4);
      expect(lesson.questions.map((q: { cognitiveLevel: string }) => q.cognitiveLevel))
        .toEqual(["remember", "understand", "analyze", "apply"]);
      expect(new Set(lesson.questions.map((q: { question: string }) => q.question)).size).toBe(4);
      for (const q of lesson.questions) {
        expect(q.options.map((option: { id: string }) => option.id)).toEqual(["a", "b", "c"]);
        expect(new Set(q.options.map((option: { text: string }) => option.text)).size).toBe(3);
        expect(q.options.some((option: { id: string }) => option.id === q.correctAnswer)).toBe(true);
        expect(q.explanation.length).toBeGreaterThan(65);
        counts[q.correctAnswer as keyof typeof counts]++;
      }
    }
    expect(dictations.size).toBe(13);
    expect(counts).toEqual({ a: 18, b: 17, c: 17 });
  });

  it("validates core spelling distinctions and prevents missing academic source approvals", () => {
    const sorted = [...lessons].sort((a,b) => a.topicOrder - b.topicOrder);
    expect(answers(sorted[0])).toContain("دعا");
    expect(answers(sorted[1])).toContain("مستشفى");
    expect(answers(sorted[2])).toContain("مُؤْمِن");
    expect(answers(sorted[6])).toContain("مَبْدَأ");
    expect(answers(sorted[7])).toContain("دفء");
    expect(answers(sorted[8])).toContain("اكتبْ");
    expect(answers(sorted[9])).toContain("فاطمة بنت محمد");
    expect(answers(sorted[10])).toContain("ماء");
    expect(answers(sorted[11])).toContain("مروءة");
    expect(answers(sorted[12])).toContain("قطع");
    for (const pack of packs) {
      expect(pack.countryCode).toBe("BH");
      expect(pack.grade).toBe(6);
      expect(pack.semester).toBe(1);
      expect(pack.academicYear).toBe("2026-2027");
      expect(pack.rights).toEqual({
        contentOwner: "dadyoom", officialTextbookBodyVerified: false,
        publicationApproved: false, teacherReview: "pending",
      });
      expect(pack.sourceIndex).toBe("data/curriculum-sources/bh-g6-s1-2026-ministry-plan-index.json");
    }
    expect(source.review.officialTextbookBodyVerified).toBe(false);
    expect(source.review.publicationApproved).toBe(false);
  });
});
