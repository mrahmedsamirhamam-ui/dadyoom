import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const name = "data/curriculum-drafts/bh-g5-s1-original-grammar-practice.json";
const pack = JSON.parse(readFileSync(resolve(process.cwd(), name), "utf8"));
const official = JSON.parse(readFileSync(resolve(process.cwd(),
  "data/curriculum-sources/bh-g5-s1-2026-ministry-plan-index.json"), "utf8"));

describe("Grade-five original grammar lessons remain Ministry-topic-linked, not falsely published", () => {
  it("links all nine grammar topics and actual training-book page ranges", () => {
    expect(pack.countryCode).toBe("BH");
    expect(pack.academicYear).toBe("2026-2027");
    expect(pack.grade).toBe(5);
    expect(pack.semester).toBe(1);
    expect(pack.sourceIndex).toBe(
      "data/curriculum-sources/bh-g5-s1-2026-ministry-plan-index.json",
    );
    expect(pack.practices).toHaveLength(9);
    expect(pack.practices.map((x: { officialTopic: string }) => x.officialTopic))
      .toEqual(official.grammarTopics.map((x: { title: string }) => x.title));
    for (const [i, lesson] of pack.practices.entries()) {
      const source = official.grammarTopics[i];
      expect(lesson.source.url).toBe(official.source.url);
      expect(lesson.source.book).toBe("التدريبات");
      expect(lesson.source.textbookPageStart).toBe(source.textbookPageStart);
      expect(lesson.source.textbookPageEnd).toBe(source.textbookPageEnd);
      expect(lesson.source.planPdfPage).toBe(source.planPdfPage);
      expect(lesson.status).toBe("original_grammar_practice_teacher_review_pending");
      expect(lesson.publicationApproved).toBe(false);
    }
    expect(pack.rights.contentOwner).toBe("dadyoom");
    expect(pack.rights.publicationApproved).toBe(false);
    expect(pack.rights.officialTextbookBodyVerified).toBe(false);
    expect(pack.rights.teacherReview).toBe("pending");
  });

  it("offers differentiated teaching, authentic examples and 36 valid multiple-choice items", () => {
    const counts = { a: 0, b: 0, c: 0 };
    expect(pack.practices.reduce(
      (n: number, lesson: { questions: unknown[] }) => n + lesson.questions.length, 0,
    )).toBe(36);
    for (const lesson of pack.practices) {
      expect(lesson.content.length).toBeGreaterThanOrEqual(850);
      expect(lesson.content).toContain("هذا الشرح أصلي من ضاديوم");
      expect(lesson.content).toContain("فروق فردية");
      expect(lesson.content).toContain("نشاط موجه");
      expect(lesson.content).not.toContain("يتناول هذا الدرس موضوع");
      expect(lesson.objectives).toHaveLength(4);
      expect(lesson.examples).toHaveLength(3);
      expect(lesson.differentiation.support).toContain("بطاقات");
      expect(lesson.differentiation.extension).toContain("مقارنة");
      expect(lesson.questions.map(
        (q: { cognitiveLevel: string }) => q.cognitiveLevel,
      )).toEqual(["remember","understand","analyze","apply"]);
      const seen = new Set();
      for (const q of lesson.questions) {
        expect(q.options.map((o: { id: string }) => o.id)).toEqual(["a","b","c"]);
        expect(new Set(q.options.map((o: { text: string }) => o.text)).size).toBe(3);
        const correct = q.options.find((option: { id: string }) =>
          option.id === q.correctAnswer);
        expect(correct).toBeTruthy();
        expect(q.explanation.length).toBeGreaterThan(50);
        counts[q.correctAnswer as keyof typeof counts]++;
        seen.add(q.question);
      }
      expect(seen.size).toBe(4);
    }
    expect(counts).toEqual({ a: 12, b: 12, c: 12 });
  });

  it("protects important Arabic grammatical facts in the authored bank", () => {
    const [past,present,subjunctive,jussive,imperative,subject,object,
      nominal,was] = pack.practices;
    const getAnswers = (lesson: { questions: Array<{
      correctAnswer: string; options: Array<{ id: string; text: string }>
    }> }) => lesson.questions.map(q =>
      q.options.find(o => o.id === q.correctAnswer)?.text);
    expect(getAnswers(past)).toContain("الضم");
    expect(getAnswers(present)).toContain("ثبوت النون");
    expect(getAnswers(subjunctive)).toContain("حذف النون");
    expect(getAnswers(jussive)).toContain("السكون");
    expect(getAnswers(imperative)).toContain("حذف حرف العلة");
    expect(getAnswers(subject)).toContain("الألف");
    expect(getAnswers(object)).toContain("الياء");
    expect(getAnswers(nominal)).toContain("الرفع");
    expect(getAnswers(was)).toContain("ترفع الاسم وتنصب الخبر");
  });
});
