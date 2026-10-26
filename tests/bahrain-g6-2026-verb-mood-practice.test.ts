import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
const pack = read("data/curriculum-drafts/bh-g6-s1-original-mood-and-imperative-practice.json");
const source = read("data/curriculum-sources/bh-g6-s1-2026-ministry-plan-index.json");
const answers = (lesson: { questions: Array<{
  correctAnswer: string; options: Array<{ id: string; text: string }>
}> }) => lesson.questions.map(q => q.options.find(o => o.id === q.correctAnswer)?.text);

describe("Grade-six independent verb-mood and imperative grammar activities", () => {
  it("honors the five official titles, order and textbook page references without publishing", () => {
    expect(pack.schemaVersion).toBe(1);
    expect(pack.countryCode).toBe("BH");
    expect(pack.grade).toBe(6);
    expect(pack.semester).toBe(1);
    expect(pack.academicYear).toBe("2026-2027");
    expect(pack.sourceIndex).toBe("data/curriculum-sources/bh-g6-s1-2026-ministry-plan-index.json");
    expect(pack.rights).toEqual({
      contentOwner:"dadyoom", officialTextbookBodyVerified:false,
      publicationApproved:false, teacherReview:"pending",
    });
    expect(pack.practices).toHaveLength(5);
    for (const [i, lesson] of pack.practices.entries()) {
      const ministry = source.grammarTopics[i+4];
      expect(lesson.officialTopic).toBe(ministry.title);
      expect(lesson.topicOrder).toBe(i+5);
      expect(lesson.source.url).toBe(source.source.url);
      expect(lesson.source.book).toBe("التدريبات");
      expect(lesson.source.textbookPageStart).toBe(ministry.textbookPageStart);
      expect(lesson.source.textbookPageEnd).toBe(ministry.textbookPageEnd);
      expect(lesson.source.planPdfPage).toBe(ministry.planPdfPage);
      expect(lesson.publicationApproved).toBe(false);
    }
  });
  it("includes five nonboilerplate teaching experiences with twenty balanced keyed questions", () => {
    const keys = { a:0,b:0,c:0 };
    for (const lesson of pack.practices) {
      expect(lesson.content.length).toBeGreaterThanOrEqual(950);
      expect(lesson.content).toContain("عمل أصيل من ضاديوم");
      expect(lesson.content).toContain("فروق فردية");
      expect(lesson.content).not.toContain("يتناول هذا الدرس موضوع");
      expect(lesson.examples).toHaveLength(3);
      expect(lesson.objectives).toHaveLength(4);
      expect(lesson.differentiation.support).toContain("بطاقات");
      expect(lesson.questions).toHaveLength(4);
      expect(lesson.questions.map((q: { cognitiveLevel: string }) => q.cognitiveLevel))
        .toEqual(["remember","understand","analyze","apply"]);
      expect(new Set(lesson.questions.map((q: { question: string }) => q.question)).size).toBe(4);
      for (const q of lesson.questions) {
        expect(q.options.map((o: { id: string }) => o.id)).toEqual(["a","b","c"]);
        expect(new Set(q.options.map((o: { text: string }) => o.text)).size).toBe(3);
        expect(q.options.some((o: { id: string }) => o.id === q.correctAnswer)).toBe(true);
        expect(q.explanation.length).toBeGreaterThanOrEqual(70);
        keys[q.correctAnswer as keyof typeof keys]++;
      }
    }
    expect(keys).toEqual({a:7,b:6,c:7});
  });
  it("checks central Arabic grammatical distinctions rather than only JSON structure", () => {
    const [raise,nasb,jazm,amr,five] = pack.practices.map(answers);
    expect(raise).toContain("ضمة مقدرة على الألف للتعذر");
    expect(raise).toContain("للثقل على الواو");
    expect(nasb).toContain("فتحة ظاهرة على الواو");
    expect(nasb).toContain("فتحة مقدرة على الألف");
    expect(jazm).toContain("حذف الألف");
    expect(jazm).toContain("يدعو");
    expect(jazm).toContain("لم يرمِ الكرة");
    expect(amr).toContain("حذف حرف العلة");
    expect(amr).toContain("ارمِ");
    expect(five).toContain("ثبوت النون");
    expect(five).toContain("حذف النون");
    expect(five).toContain("يكتبُ");
  });
});
