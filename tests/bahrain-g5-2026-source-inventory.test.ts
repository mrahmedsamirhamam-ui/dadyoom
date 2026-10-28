import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourceIndex = JSON.parse(readFileSync(resolve(process.cwd(),
  "data/curriculum-sources/bh-g5-s1-2026-ministry-plan-index.json"), "utf8"));
const normalized = (value: string) => value.normalize("NFKD")
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
  .replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

describe("Grade-five Bahrain official plan source index is not mistaken for a full syllabus", () => {
  it("references 2026–27 official document pages without pretending text extraction proves visual or book verification", () => {
    expect(sourceIndex.countryCode).toBe("BH");
    expect(sourceIndex.academicYear).toBe("2026-2027");
    expect(sourceIndex.grade).toBe(5);
    expect(sourceIndex.semester).toBe(1);
    expect(sourceIndex.source.url).toBe(
      "https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf",
    );
    expect(sourceIndex.source.planPdfPages).toEqual([22,23,24,25]);
    expect(sourceIndex.source.retrievalMethod).toBe("official_pdf_text_extraction");
    expect(sourceIndex.source.visualTableVerification).toBe("pending");
    expect(sourceIndex.review.originalBooksCompared).toBe(false);
    expect(sourceIndex.review.publicationApproved).toBe(false);
    expect(sourceIndex.review.poetryAndReligiousPrimaryTextVerified).toBe(false);
    expect(sourceIndex.review.officialAudioImported).toBe(false);
    expect(sourceIndex.review.writingSkillsCoverage).toBe("source_indexed_not_book_verified");
    expect(sourceIndex.review.handwritingCoverage).toBe("source_indexed_not_book_verified");
  });

  it("captures 13 reading, 3 listening, 9 grammar, 9 spelling components separately", () => {
    expect(sourceIndex.readingTopics).toHaveLength(13);
    expect(sourceIndex.listeningTopics).toHaveLength(3);
    expect(sourceIndex.grammarTopics).toHaveLength(9);
    expect(sourceIndex.spellingTopics).toHaveLength(9);
    expect(sourceIndex.writingTopics).toHaveLength(12);
    expect(sourceIndex.handwritingTopics).toHaveLength(12);
    const reading = sourceIndex.readingTopics;
    expect(reading.map((l: { number: number }) => l.number))
      .toEqual(Array.from({ length: 13 }, (_, i) => i + 1));
    expect(reading.map((l: { title: string }) => normalized(l.title))).toEqual([
      "وبالوالدين إحسانا", "معلمنا الأول", "كنا يدا واحدة", "برايل في كنف أسرته",
      "جدتي", "الصديق وقت الضيق", "اعتذار صديق", "كيف صرنا أصدقاء؟",
      "دعوة إلى الإخاء", "معا في حب وطننا البحرين", "البحرين تتكلم",
      "هتاف العقول", "رمز الحضارة",
    ].map(normalized));
    expect(reading.map((l: { textbookPageStart: number }) => l.textbookPageStart))
      .toEqual([8,12,16,20,24,28,32,36,40,44,48,52,56]);
    expect(reading.map((l: { textbookPageEnd: number }) => l.textbookPageEnd))
      .toEqual([10,15,19,23,26,31,35,39,42,47,51,55,59]);
    expect(sourceIndex.listeningTopics.map((l: { textbookPageStart: number }) =>
      l.textbookPageStart)).toEqual([7,32,56]);
    expect(sourceIndex.grammarTopics.map((l: { title: string }) => l.title))
      .toContain("الفاعل");
    expect(sourceIndex.spellingTopics.map((l: { title: string }) => l.title))
      .toContain("همزتا الوصل والقطع");
  });

  it("preserves authentic grade-five writing and handwriting progressions as source-only entries", () => {
    const writing = sourceIndex.writingTopics;
    const handwriting = sourceIndex.handwritingTopics;
    expect(writing.map((x: { title: string }) => x.title)).toEqual([
      "المعطى والمطلوب في الموضوع الإنشائي (1)",
      "المعطى والمطلوب في الموضوع الإنشائي (2)",
      "البنية الثلاثية في النص السردي (1)",
      "البنية الثلاثية في النص السردي (2)",
      "البنية الثلاثية في النص السردي (3)",
      "التقرير (1)", "التقرير (2)",
      "الرسالة الشخصية (1)", "الرسالة الشخصية (2)",
      "إثراء النص السردي بالوصف (1)", "إثراء النص السردي بالوصف (2)",
      "إثراء النص السردي بالوصف (3)",
    ]);
    expect(handwriting.map((x: { title: string }) => x.title)).toEqual([
      "حرف (أ)", "حرف (ب)", "حرف (ت)", "حرف (ث)", "حرف (ج)",
      "حرفا (ح) و(خ)", "حرف (د)", "حرف (ذ)", "حرف (ر)", "حرف (ز)",
      "حرفا (س) و(ش)", "حرف (ص)",
    ]);
    expect(writing[0].textbookPageStart).toBe(9);
    expect(writing[11].textbookPageEnd).toBe(76);
    expect(handwriting[0].textbookPageStart).toBe(6);
    expect(handwriting[11].textbookPageEnd).toBe(33);
    expect([...writing, ...handwriting].every((x: {
      officialTextbookActivityVerified: boolean; sourceReview: string
    }) => x.officialTextbookActivityVerified === false &&
      x.sourceReview === "official_pdf_text_extracted_visual_verification_pending")).toBe(true);
  });

  it("prohibits repackaging source-only titles as published lessons or official audio", () => {
    const components = [
      ...sourceIndex.readingTopics, ...sourceIndex.listeningTopics,
      ...sourceIndex.grammarTopics, ...sourceIndex.spellingTopics,
      ...sourceIndex.writingTopics, ...sourceIndex.handwritingTopics,
    ];
    expect(components).toHaveLength(58);
    for (const component of components) {
      expect(component.title.length).toBeGreaterThan(3);
      expect(component.textbookPageStart).toBeGreaterThan(0);
      expect(component.textbookPageEnd).toBeGreaterThanOrEqual(component.textbookPageStart);
      expect(component.planPdfPage).toBeGreaterThanOrEqual(22);
      expect(component.planPdfPage).toBeLessThanOrEqual(25);
      expect(component.content).toBeUndefined();
      expect(component.questions).toBeUndefined();
      expect(component.published).not.toBe(true);
    }
    expect(sourceIndex.listeningTopics.every((l: { officialAudioTranscriptVerified: boolean }) =>
      l.officialAudioTranscriptVerified === false)).toBe(true);
  });
});
