import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
const pack = read("data/curriculum-drafts/bh-g5-s1-original-writing-workshops.json");
const index = read("data/curriculum-sources/bh-g5-s1-2026-ministry-plan-index.json");

describe("G5 original writing workshops follow Ministerial source titles and teacher-only marking", () => {
  it("maps all 12 writing source topics, course books and page ranges without publication rights", () => {
    expect(pack.schemaVersion).toBe(1);
    expect(pack.countryCode).toBe("BH");
    expect(pack.grade).toBe(5);
    expect(pack.semester).toBe(1);
    expect(pack.academicYear).toBe("2026-2027");
    expect(pack.rights).toEqual({
      contentOwner: "dadyoom", officialTextbookBodyVerified: false,
      publicationApproved: false, teacherReview: "pending",
    });
    expect(pack.practices).toHaveLength(12);
    expect(pack.practices.map((p: { officialTopic: string }) => p.officialTopic))
      .toEqual(index.writingTopics.map((p: { title: string }) => p.title));
    for (const [i, lesson] of pack.practices.entries()) {
      const src = index.writingTopics[i];
      expect(lesson.source.url).toBe(index.source.url);
      expect(lesson.source.book).toBe("دروب الكتابة");
      expect(lesson.source.textbookPageStart).toBe(src.textbookPageStart);
      expect(lesson.source.textbookPageEnd).toBe(src.textbookPageEnd);
      expect(lesson.source.planPdfPage).toBe(src.planPdfPage);
      expect(lesson.source.visualTableVerification).toBe("pending");
      expect(lesson.status).toBe("original_writing_workshop_teacher_review_pending");
      expect(lesson.publicationApproved).toBe(false);
    }
  });

  it("keeps original models optional and requires human feedback rather than invented machine grades", () => {
    const models = new Set<string>();
    for (const p of pack.practices) {
      expect(p.teaching.prompt.length).toBeGreaterThan(65);
      expect(p.teaching.originalTeacherModel.length).toBeGreaterThan(160);
      expect(p.teaching.teacherModelIsNotRequiredStudentAnswer).toBe(true);
      expect(p.teaching.requiredChecklist).toHaveLength(3);
      expect(p.teaching.scaffold).toContain("دون إعطاء إجابة للنسخ");
      expect(p.teaching.extension).toContain("للمتقدم");
      expect(p.teaching.selfAssessment).toContain("أراجع");
      expect(p.objectives).toHaveLength(4);
      expect(p.rubric).toHaveLength(4);
      expect(p.rubric.reduce((score: number, c: { max: number }) => score + c.max, 0))
        .toBe(12);
      expect(p.assessment).toEqual({
        mode: "human_teacher_only", autoTextGrading: false, totalPoints: 12,
      });
      models.add(p.teaching.originalTeacherModel);
    }
    expect(models.size).toBe(12);
  });
});
