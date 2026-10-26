import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = JSON.parse(readFileSync(resolve(process.cwd(),
  "data/curriculum-sources/bh-g6-s1-2026-ministry-plan-index.json"), "utf8"));

describe("Bahrain G6 2026-27 official plan source inventory not mistaken for authored lessons", () => {
  it("covers source plan pages 26-28 and excludes all unverified primary source material", () => {
    expect(source.countryCode).toBe("BH");
    expect(source.grade).toBe(6);
    expect(source.semester).toBe(1);
    expect(source.academicYear).toBe("2026-2027");
    expect(source.source.url).toBe("https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf");
    expect(source.source.planPdfPages).toEqual([26, 27, 28]);
    expect(source.source.visualTableVerification).toBe("pending");
    expect(source.review.publicationApproved).toBe(false);
    expect(source.review.officialTextbookBodyVerified).toBe(false);
    expect(source.review.officialTeacherGuideAudioVerified).toBe(false);
    expect(source.review.poetryQuranTextVerified).toBe(false);
  });

  it("contains 14 reading, 3 listening, 13 grammar, 13 spelling and 6 writing topic references", () => {
    expect(source.readingTopics).toHaveLength(14);
    expect(source.listeningTopics).toHaveLength(3);
    expect(source.grammarTopics).toHaveLength(13);
    expect(source.spellingTopics).toHaveLength(13);
    expect(source.writingTopics).toHaveLength(6);
    expect(source.readingTopics[2].title).toBe("طريق الخير (1)");
    expect(source.readingTopics[3].title).toBe("طريق الخير (2)");
    expect(source.readingTopics[3].textbookPageStart).toBe(19);
    expect(source.readingTopics[3].textbookPageEnd).toBe(21);
    expect(source.grammarTopics[2].title).toBe("بناء الفعل الماضي على الضم والسكون (1)");
    expect(source.grammarTopics[3].title).toBe("بناء الفعل الماضي على الضم والسكون (2)");
    expect(source.listeningTopics.map((x: { textbookPageStart: number }) =>
      x.textbookPageStart)).toEqual([127,129,130]);
    expect(source.writingTopics.map((x: { textbookPageStart: number }) =>
      x.textbookPageStart)).toEqual([8,11,13,16,22,25]);
    expect(source.readingTopics[0].componentScope).toBe("quran_primary_text_source_required");
    expect(source.readingTopics.filter(
      (r: { componentScope: string }) => r.componentScope === "poem_primary_text_required"
    )).toHaveLength(5);
  });

  it("keeps all 49 source entries without learner answers, invented textbook text or approval", () => {
    const entries = [
      ...source.readingTopics, ...source.listeningTopics, ...source.grammarTopics,
      ...source.spellingTopics, ...source.writingTopics,
    ];
    expect(entries).toHaveLength(49);
    for (const item of entries) {
      expect(item.title.trim().length).toBeGreaterThan(3);
      expect(item.textbookPageStart).toBeGreaterThan(0);
      expect(item.textbookPageEnd).toBeGreaterThanOrEqual(item.textbookPageStart);
      expect(item.planPdfPage).toBeGreaterThanOrEqual(26);
      expect(item.planPdfPage).toBeLessThanOrEqual(28);
      expect(item.sourceReview).toBe("official_pdf_text_extracted_visual_verification_pending");
      expect(item.publicationApproved).toBe(false);
      expect(item.content).toBeUndefined();
      expect(item.questions).toBeUndefined();
      expect(item.correctAnswer).toBeUndefined();
    }
  });
});
