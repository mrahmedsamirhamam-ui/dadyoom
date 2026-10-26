import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
const pack = read("data/curriculum-drafts/bh-g5-s1-original-handwriting-practice.json");
const index = read("data/curriculum-sources/bh-g5-s1-2026-ministry-plan-index.json");

describe("Bahrain G5 source-indexed, original handwriting guidance", () => {
  it("maps the twelve Ministry handwriting letter topics without claiming textbook exemplars", () => {
    expect(pack.grade).toBe(5);
    expect(pack.semester).toBe(1);
    expect(pack.academicYear).toBe("2026-2027");
    expect(pack.rights).toEqual({
      contentOwner: "dadyoom", officialHandwritingExemplarVerified: false,
      publicationApproved: false, teacherReview: "pending",
    });
    expect(pack.practices).toHaveLength(12);
    expect(pack.practices.map((p: { officialTopic: string }) => p.officialTopic))
      .toEqual(index.handwritingTopics.map((p: { title: string }) => p.title));
    for (const [i, lesson] of pack.practices.entries()) {
      const record = index.handwritingTopics[i];
      expect(lesson.source.url).toBe(index.source.url);
      expect(lesson.source.book).toBe("كرّاسة الخطّ");
      expect(lesson.source.textbookPageStart).toBe(record.textbookPageStart);
      expect(lesson.source.textbookPageEnd).toBe(record.textbookPageEnd);
      expect(lesson.source.visualTableVerification).toBe("pending");
      expect(lesson.status).toBe("original_handwriting_guidance_teacher_review_pending");
      expect(lesson.publicationApproved).toBe(false);
    }
  });

  it("specifies 48 letter-context vocabulary samples, writing sequence and real teacher observation", () => {
    const all = new Set<string>();
    for (const lesson of pack.practices) {
      expect(lesson.lesson.objective).toContain("أن يكتب المتعلم");
      expect(lesson.lesson.words).toHaveLength(4);
      expect(lesson.lesson.sentenceToCopy.length).toBeGreaterThan(20);
      expect(lesson.lesson.guidedSequence).toHaveLength(5);
      expect(lesson.lesson.differentiation.support).toContain("بطاقات");
      expect(lesson.lesson.differentiation.extension).toContain("جملة جديدة");
      expect(lesson.lesson.teacherNote).toContain("لا يمثل ورقة رسم");
      expect(lesson.rubric).toHaveLength(4);
      expect(lesson.assessment).toEqual({
        mode: "human_teacher_observation_only",
        automaticPenStrokeRecognition: false,
        totalPoints: 12,
      });
      expect(lesson.rendering).toEqual({
        traceSheetRendered: false,
        visualStrokeTemplateVerified: false,
        printedWorksheetsReady: false,
      });
      for (const word of lesson.lesson.words) all.add(word);
    }
    expect(all.size).toBeGreaterThanOrEqual(38);
    expect(pack.practices[5].targetLetters).toEqual(["ح", "خ"]);
    expect(pack.practices[10].targetLetters).toEqual(["س", "ش"]);
  });
});
