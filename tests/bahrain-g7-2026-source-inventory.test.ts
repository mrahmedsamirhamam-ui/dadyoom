import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = JSON.parse(readFileSync(resolve(
  process.cwd(), "data/curriculum-sources/bh-g7-s1-2026-ministry-plan-index.json",
), "utf8"));

describe("Bahrain Grade 7 first-semester Ministry source-only curriculum map", () => {
  it("maps official 2026-27 Ministry stage, source pages and week divisions without inventing textbook page locations", () => {
    expect(source.countryCode).toBe("BH");
    expect(source.grade).toBe(7);
    expect(source.semester).toBe(1);
    expect(source.academicYear).toBe("2026-2027");
    expect(source.schoolStage).toBe("الإعدادي");
    expect(source.source.url).toBe("https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf");
    expect(source.source.planPdfPages).toEqual([30,31,32]);
    expect(source.source.visualTableVerification).toBe("pending");
    expect(source.review.publicationApproved).toBe(false);
    expect(source.review.officialTextbookBodyVerified).toBe(false);
    expect(source.review.teacherEditorialReview).toBe("pending");
    expect(source.review.originalAudioListVerified).toBe(false);
  });

  it("preserves 11 reading, 12 grammar, 11 spelling/handwriting, 9 writing SOURCE headings", () => {
    expect(source.readingTopics).toHaveLength(11);
    expect(source.grammarTopics).toHaveLength(12);
    expect(source.spellingAndHandwritingTopics).toHaveLength(11);
    expect(source.writingTopics).toHaveLength(9);
    expect(source.readingTopics.map((x: {week:number}) => x.week))
      .toEqual([1,2,4,5,6,7,9,10,11,12,13]);
    expect(source.grammarTopics.map((x: {week:number}) => x.week))
      .toEqual([1,2,3,4,5,6,8,9,10,11,12,13]);
    expect(source.readingTopics[0].title).toBe("من الهدي القرآني");
    expect(source.readingTopics[1].title).toBe("لماذا نقرأ؟");
    expect(source.readingTopics[10].title).toBe("الأزهار");
    expect(source.readingTopics[0].textbookPageStart).toBe(9);
    expect(source.readingTopics[10].textbookPageEnd).toBe(143);
    expect(source.readingTopics.find((x: {title:string}) => x.title==="بلادي")?.primarySourceScope)
      .toBe("poetry-original-source-required");
    expect(source.writingTopics.at(-1).title).toBe("كتابة بطاقة دعوة");
    expect(source.spellingAndHandwritingTopics[0].title).toContain("ألف التفريق");
  });

  it("keeps all 43 entries as review-required metadata, without copied textbook/poem/Quran or invented audio", () => {
    const entries = [
      ...source.readingTopics, ...source.grammarTopics,
      ...source.spellingAndHandwritingTopics, ...source.writingTopics,
    ];
    expect(entries).toHaveLength(43);
    for (const topic of entries) {
      expect(topic.sourceReview).toBe("official_pdf_text_extracted_visual_verification_pending");
      expect(topic.publicationApproved).toBe(false);
      expect(topic.officialTextbookTextVerified).toBe(false);
      expect(topic.planPdfPage).toBeGreaterThanOrEqual(30);
      expect(topic.planPdfPage).toBeLessThanOrEqual(32);
      expect(topic.week).toBeGreaterThanOrEqual(1);
      expect(topic.week).toBeLessThanOrEqual(13);
      expect(topic.content).toBeUndefined();
      expect(topic.questions).toBeUndefined();
    }
    for (const topic of [
      ...source.grammarTopics, ...source.spellingAndHandwritingTopics, ...source.writingTopics,
    ]) {
      expect(topic.textbookPageStart).toBeNull();
      expect(topic.textbookPageEnd).toBeNull();
      expect(topic.textbookPageRangeEvidence).toContain("requires rendered table visual review");
    }
    expect(source.listening.officialAudioTitlesVerified).toBe(false);
    expect(source.listening.topicCountNotClaimed).toBe(true);
  });
});
