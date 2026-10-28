import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const draftPath = resolve(
  process.cwd(), "data/curriculum-drafts/bh-g4-s1-original-listening-practice.json",
);
const sourcePath = resolve(
  process.cwd(), "data/curriculum-sources/bahrain-2026-s1-ministry-plan-index.json",
);
const data = JSON.parse(readFileSync(draftPath, "utf8"));
const source = JSON.parse(readFileSync(sourcePath, "utf8"));
const official = source.listeningLessons.filter((item: { grade: number }) => item.grade === 4);

describe("Bahrain Grade 4 original listening practice stays source-linked and unreleased", () => {
  it("maps all ten approved topic labels to official plan PDF pages without inventing an audio recording", () => {
    expect(data.academicYear).toBe("2026-2027");
    expect(data.countryCode).toBe("BH");
    expect(data.grade).toBe(4);
    expect(data.semester).toBe(1);
    expect(data.source.url).toBe("https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf");
    expect(data.source.sha256).toBe(source.sourceDocuments[0].sha256);
    expect(data.source.sourceTitleOnly).toBe(true);
    expect(official).toHaveLength(10);
    expect(data.activities).toHaveLength(10);
    expect(data.activities.map((a: { officialTopic: string }) => a.officialTopic))
      .toEqual(official.map((item: { title: string }) => item.title));
    expect(data.activities.map((a: { sourcePlanPdfPage: number }) => a.sourcePlanPdfPage))
      .toEqual(official.map((item: { sourcePdfPage: number }) => item.sourcePdfPage));
    expect(data.rights.scriptOwner).toBe("dadyoom");
    expect(data.rights.officialAudioImported).toBe(false);
    expect(data.rights.officialTextbookTranscriptVerified).toBe(false);
    expect(data.rights.publicationApproved).toBe(false);
    expect(data.rights.teacherAudioReview).toBe("pending");
  });

  it("contains ten substantial original teacher-read scripts with forty diverse, properly keyed questions", () => {
    const balance = { a: 0, b: 0, c: 0 };
    const scripts = new Set<string>();
    for (const item of data.activities) {
      expect(item.status).toBe("original_teacher_read_aloud_draft_not_official_audio");
      expect(item.recordingPresent).toBe(false);
      expect(item.audioTranscriptVerified).toBe(false);
      expect(item.publicationApproved).toBe(false);
      expect(item.sourceKind).toBe("official_listening_topic_title_only");
      expect(item.originalTeacherScript.length).toBeGreaterThanOrEqual(500);
      expect(item.originalTeacherScript).not.toContain("يتناول هذا الدرس موضوع");
      scripts.add(item.originalTeacherScript);
      expect(item.vocabularyTargets.length).toBe(3);
      expect(item.teachingNotes.firstListening).toContain("يقرأ المعلم");
      expect(item.teachingNotes.secondListening).toContain("مفاتيح الإجابة");
      expect(item.teachingNotes.differentiation).toContain("للمتقدم");
      expect(item.questions).toHaveLength(4);
      expect(item.questions.map((q: { cognitiveLevel: string }) => q.cognitiveLevel))
        .toEqual(["remember", "understand", "infer", "apply"]);
      for (const question of item.questions) {
        expect(question.options.map((o: { id: string }) => o.id)).toEqual(["a","b","c"]);
        expect(new Set(question.options.map((o: { text: string }) => o.text)).size).toBe(3);
        expect(question.options.some((o: { id: string }) =>
          o.id === question.correctAnswer)).toBe(true);
        expect(question.explanation.length).toBeGreaterThan(70);
        balance[question.correctAnswer as keyof typeof balance]++;
      }
    }
    expect(scripts.size).toBe(10);
    expect(data.activities.reduce(
      (sum: number, item: { questions: unknown[] }) => sum + item.questions.length, 0,
    )).toBe(40);
    expect(Object.values(balance).every(n => n >= 9 && n <= 18)).toBe(true);
  });

  it("remains in draft folder and is never part of curriculum publish/import input", () => {
    expect(draftPath).toContain("/curriculum-drafts/");
    expect(data.purpose).toContain("not Ministry");
    expect(data.activities.every((item: { publicationApproved: boolean }) =>
      item.publicationApproved === false)).toBe(true);
  });
});
