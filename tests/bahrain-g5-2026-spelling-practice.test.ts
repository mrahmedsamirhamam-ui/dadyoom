import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const file = "data/curriculum-drafts/bh-g5-s1-original-spelling-practice.json";
const pack = JSON.parse(readFileSync(resolve(process.cwd(), file), "utf8"));
const official = JSON.parse(readFileSync(resolve(process.cwd(),
  "data/curriculum-sources/bh-g5-s1-2026-ministry-plan-index.json"), "utf8"));

describe("Bahrain G5 original spelling activities and answer-key provenance", () => {
  it("maps the nine spelling topics to the Ministry plan index while remaining unapproved", () => {
    expect(pack.schemaVersion).toBe(1);
    expect(pack.countryCode).toBe("BH");
    expect(pack.grade).toBe(5);
    expect(pack.semester).toBe(1);
    expect(pack.academicYear).toBe("2026-2027");
    expect(pack.sourceIndex).toBe("data/curriculum-sources/bh-g5-s1-2026-ministry-plan-index.json");
    expect(pack.rights).toEqual({
      contentOwner: "dadyoom", officialTextbookBodyVerified: false,
      publicationApproved: false, teacherReview: "pending",
    });
    expect(pack.practices).toHaveLength(9);
    expect(pack.practices.map((p: { officialTopic: string }) => p.officialTopic))
      .toEqual(official.spellingTopics.map((p: { title: string }) => p.title));
    for (const [i, p] of pack.practices.entries()) {
      const record = official.spellingTopics[i];
      expect(p.topicOrder).toBe(i + 1);
      expect(p.source.url).toBe(official.source.url);
      expect(p.source.book).toBe("التدريبات");
      expect(p.source.textbookPageStart).toBe(record.textbookPageStart);
      expect(p.source.textbookPageEnd).toBe(record.textbookPageEnd);
      expect(p.source.planPdfPage).toBe(record.planPdfPage);
      expect(p.source.visualTableVerification).toBe("pending");
      expect(p.status).toBe("original_spelling_practice_teacher_review_pending");
      expect(p.publicationApproved).toBe(false);
    }
  });

  it("contains 9 original explanations, application dictations, differentiation and 36 keyed assessments", () => {
    const counts = { a: 0, b: 0, c: 0 };
    const dictations = new Set<string>();
    for (const p of pack.practices) {
      expect(p.content.length).toBeGreaterThanOrEqual(850);
      expect(p.content).toContain("تأليف أصلي من ضاديوم");
      expect(p.content).toContain("إملاء تطبيقي أصلي");
      expect(p.content).toContain("الفروق الفردية");
      expect(p.content).not.toContain("يتناول هذا الدرس موضوع");
      expect(p.examples).toHaveLength(3);
      expect(p.objectives).toHaveLength(4);
      expect(p.dictationPrompt.length).toBeGreaterThan(25);
      dictations.add(p.dictationPrompt);
      expect(p.differentiation.support).toContain("بطاقات");
      expect(p.differentiation.extension).toContain("مقارنة");
      expect(p.questions).toHaveLength(4);
      expect(p.questions.map((q: { cognitiveLevel: string }) => q.cognitiveLevel))
        .toEqual(["remember", "understand", "analyze", "apply"]);
      expect(new Set(p.questions.map((q: { question: string }) => q.question)).size).toBe(4);
      for (const q of p.questions) {
        expect(q.options.map((o: { id: string }) => o.id)).toEqual(["a", "b", "c"]);
        expect(new Set(q.options.map((o: { text: string }) => o.text)).size).toBe(3);
        expect(q.options.some((o: { id: string }) => o.id === q.correctAnswer)).toBe(true);
        expect(q.explanation.length).toBeGreaterThan(65);
        counts[q.correctAnswer as keyof typeof counts]++;
      }
    }
    expect(dictations.size).toBe(9);
    expect(counts).toEqual({ a: 12, b: 12, c: 12 });
  });

  it("protects distinct orthographic contexts and prevents conflating alef and hamza seats", () => {
    const answerTexts = pack.practices.map((p: { questions: Array<{
      correctAnswer: string; options: Array<{ id: string; text: string }>
    }> }) => p.questions.map(q => q.options.find(o => o.id === q.correctAnswer)?.text));
    expect(answerTexts[0]).toContain("فتى");
    expect(answerTexts[1]).toContain("اكتبْ");
    expect(answerTexts[2]).toContain("سَأَلَ");
    expect(answerTexts[3]).toContain("رَأْس");
    expect(answerTexts[4]).toContain("مروءة");
    expect(answerTexts[5]).toContain("فَجْأَة");
    expect(answerTexts[6]).toContain("يُؤَدِّي");
    expect(answerTexts[7]).toContain("بُؤْس");
    expect(answerTexts[8]).toContain("رُؤُوس");
  });
});
