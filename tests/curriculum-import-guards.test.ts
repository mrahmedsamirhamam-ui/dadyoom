import { describe, expect, it } from "vitest";
import { assertSafeExistingCurriculumLesson } from "@/lib/curriculum-packs/import-guards.mjs";

describe("curriculum import published lesson identity", () => {
  const lesson = { title: "بناء الفعل الماضي", status: "published" };

  it("accepts the same approved published lesson", () => {
    expect(() => assertSafeExistingCurriculumLesson(
      lesson, { title: " بناء الفعل الماضي " },
    )).not.toThrow();
  });

  it("blocks accidental auto-publication of the 62 draft lessons", () => {
    for (const status of ["draft", "pending", null, "archived"]) {
      expect(() => assertSafeExistingCurriculumLesson(
        { title: lesson.title, status },
        { title: lesson.title },
      )).toThrow("CURRICULUM_DRAFT_REQUIRES_SEPARATE_REVIEW");
    }
  });

  it("rejects same-number lessons with different titles before attaching questions", () => {
    expect(() => assertSafeExistingCurriculumLesson(
      lesson, { title: "إعراب الفعل المضارع" },
    )).toThrow("CURRICULUM_EXISTING_LESSON_TITLE_CONFLICT");
  });
});
