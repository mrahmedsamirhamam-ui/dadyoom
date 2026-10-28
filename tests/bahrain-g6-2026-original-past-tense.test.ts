import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => JSON.parse(readFileSync(resolve(process.cwd(), p), "utf8"));
const pack = read("data/curriculum-drafts/bh-g6-s1-original-past-tense-practice.json");
const index = read("data/curriculum-sources/bh-g6-s1-2026-ministry-plan-index.json");

describe("Grade 6 original past-tense practice is educational and unapproved", () => {
  it("matches exactly the two Ministry titles and textbook pages", () => {
    expect(pack.countryCode).toBe("BH");
    expect(pack.grade).toBe(6);
    expect(pack.semester).toBe(1);
    expect(pack.academicYear).toBe("2026-2027");
    expect(pack.rights).toEqual({
      contentOwner: "dadyoom", officialTextbookBodyVerified: false,
      publicationApproved: false, teacherReview: "pending",
    });
    expect(pack.practices).toHaveLength(2);
    for (const [i, p] of pack.practices.entries()) {
      expect(p.officialTopic).toBe(index.grammarTopics[i + 2].title);
      expect(p.source.url).toBe(index.source.url);
      expect(p.source.book).toBe("التدريبات");
      expect(p.source.textbookPageStart).toBe(index.grammarTopics[i+2].textbookPageStart);
      expect(p.source.textbookPageEnd).toBe(index.grammarTopics[i+2].textbookPageEnd);
      expect(p.publicationApproved).toBe(false);
      expect(p.status).toBe("original_g6_grammar_teacher_review_pending");
    }
  });

  it("teaches genuine distinctions for الضم, السكون and تاء التأنيث with eight valid questions", () => {
    const keys = { a: 0, b: 0, c: 0 };
    for (const p of pack.practices) {
      expect(p.content.length).toBeGreaterThanOrEqual(800);
      expect(p.content).toContain("من تأليف ضاديوم");
      expect(p.content).toContain("الفروق الفردية");
      expect(p.objectives).toHaveLength(4);
      expect(p.examples).toHaveLength(3);
      expect(p.questions).toHaveLength(4);
      for (const q of p.questions) {
        expect(q.options.map((o: { id: string }) => o.id)).toEqual(["a","b","c"]);
        expect(q.options.some((o: { id: string }) => o.id === q.correctAnswer)).toBe(true);
        expect(q.explanation.length).toBeGreaterThan(70);
        keys[q.correctAnswer as keyof typeof keys]++;
      }
    }
    const correctTexts = pack.practices.map((p: { questions: Array<{
      correctAnswer: string; options: Array<{ id: string; text: string }>
    }> }) => p.questions.map(q => q.options.find(o => o.id === q.correctAnswer)?.text));
    expect(correctTexts[0]).toContain("الضم");
    expect(correctTexts[0]).toContain("واو الجماعة");
    expect(correctTexts[1]).toContain("نا الفاعلين");
    expect(correctTexts[1]).toContain("حَضَرْنَ");
    expect(correctTexts[1]).toContain("لأن تاءها للتأنيث الساكنة وليست ضمير رفع");
    expect(keys).toEqual({ a: 3, b: 2, c: 3 });
  });
});
