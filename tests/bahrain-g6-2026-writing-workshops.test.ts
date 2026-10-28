import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
const source = read("data/curriculum-sources/bh-g6-s1-2026-ministry-plan-index.json");
const pack = read("data/curriculum-drafts/bh-g6-s1-original-writing-workshops.json");

describe("Bahrain Grade-6 six original writing workshops — ethical teacher assessment", () => {
  it("aligns all six Ministry first-term narrative source topics and original textbook page ranges", () => {
    expect(pack.countryCode).toBe("BH");
    expect(pack.grade).toBe(6);
    expect(pack.semester).toBe(1);
    expect(pack.academicYear).toBe("2026-2027");
    expect(pack.practices).toHaveLength(6);
    expect(pack.sourceIndex).toBe("data/curriculum-sources/bh-g6-s1-2026-ministry-plan-index.json");
    expect(pack.practices.map((p: { officialTopic: string }) => p.officialTopic))
      .toEqual(source.writingTopics.map((s: { title: string }) => s.title));
    for (const [i, item] of pack.practices.entries()) {
      const official = source.writingTopics[i];
      expect(item.topicOrder).toBe(i + 1);
      expect(item.source.url).toBe(source.source.url);
      expect(item.source.book).toBe(official.book);
      expect(item.source.textbookPageStart).toBe(official.textbookPageStart);
      expect(item.source.textbookPageEnd).toBe(official.textbookPageEnd);
      expect(item.source.planPdfPage).toBe(official.planPdfPage);
      expect(item.source.visualTableVerification).toBe("pending");
      expect(item.publicationApproved).toBe(false);
      expect(item.status).toBe("original_g6_writing_workshop_teacher_review_pending");
    }
  });

  it("contains six distinct student-writing prompts with full original models and differentiated workshops", () => {
    const prompts = new Set<string>();
    const models = new Set<string>();
    for (const item of pack.practices) {
      expect(item.teaching.focus.length).toBeGreaterThan(45);
      expect(item.teaching.prompt.length).toBeGreaterThan(80);
      expect(item.teaching.planningSteps).toHaveLength(3);
      expect(item.teaching.guidedPractice).toContain("كل متعلم نصًا مستقلًا");
      expect(item.teaching.independentPractice).toContain("أنتج فقرتين");
      expect(item.teaching.originalTeacherModel.length).toBeGreaterThanOrEqual(300);
      expect(item.teaching.modelIsNotMandatoryStudentAnswer).toBe(true);
      expect(item.teaching.differentiation.support).toContain("بطاقات");
      expect(item.teaching.differentiation.extension).toContain("غيّر نهاية");
      expect(item.teaching.reflection).toContain("أكتب تعديلًا واحدًا");
      expect(item.objectives).toHaveLength(4);
      prompts.add(item.teaching.prompt);
      models.add(item.teaching.originalTeacherModel);
      expect(item.rubric).toHaveLength(4);
      expect(item.rubric.reduce((n: number, r: { max: number }) => n + r.max, 0)).toBe(12);
      expect(item.assessment).toEqual({
        mode: "human_teacher_review_only", automaticFreeTextGrade: false,
        totalRubricPoints: 12, studentPrivateData: "not_included",
      });
    }
    expect(prompts.size).toBe(6);
    expect(models.size).toBe(6);
  });

  it("prevents auto-grading claims and all unreviewed classroom release", () => {
    expect(pack.rights).toEqual({
      contentOwner: "dadyoom", officialTextbookBodyVerified: false,
      publicationApproved: false, teacherReview: "pending",
    });
    expect(source.review.officialTextbookBodyVerified).toBe(false);
    expect(source.review.publicationApproved).toBe(false);
    expect(pack.practices.every((item: { publicationApproved: boolean }) =>
      item.publicationApproved === false)).toBe(true);
  });
});
