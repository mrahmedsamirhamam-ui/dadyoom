import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const lesson = read("app/lessons/[id]/page.tsx");
const practice = read("features/lessons/components/LessonPracticeWorkspace.tsx");
const bulk = read("data/curriculum-completeness/bahrain-bulk-fill-missing-original-lesson-objectives-safe-20261016.sql");

describe("All published content-ready lessons receive a real practice pathway", () => {
  test("shared practice is wired to the main lesson page, never draft preview or book-only cards", () => {
    expect(lesson).toContain("LessonPracticeWorkspace");
    expect(lesson).toContain('lesson.status === "published"');
    expect(lesson).toContain("lessonBody.length >= 250 && !referenceOnly");
    expect(lesson).toContain("هذا الدرس يحتاج مادة تعليمية إضافية");
    expect(lesson).toContain("lessonType={lesson.lesson_type}");
    expect(lesson).toContain("objective={objectives[0]}");
  });

  test("all existing eight lesson types have differentiated prompts and student actions", () => {
    for (const type of ["reading", "grammar", "listening", "speaking", "writing", "spelling", "vocabulary", "assessment"]) {
      expect(practice).toContain(`  ${type}: {`);
    }
    for (const name of ["support:", "apply:", "challenge:"]) {
      expect(practice).toContain(name);
    }
    expect(practice).toContain("onClick={() => { setLevel(key); setCheckOpen(false); }}");
    expect(practice).toContain("setDrafts((old)");
    expect(practice).toContain("setCompleted((old)");
    expect(practice).toContain("لا تُحفظ في حسابك ولا تُصحح آليًا"); // no implicit saved server-side work
  });

  test("one-pass bulk update modifies only missing goals on genuine content and preserves all official records", () => {
    expect(bulk).toContain("co.code='BH'");
    expect(bulk).toContain("l.status='published'");
    expect(bulk).toContain("jsonb_array_length");
    expect(bulk).toContain("length(btrim(coalesce(l.content,'')))>=700");
    expect(bulk).toContain("هذا عنصر من كتاب");
    expect(bulk).toContain("مدخل OCR غير محسوم");
    expect(bulk).toContain("SET learning_objectives=b.objectives");
    expect(bulk).not.toContain("SET content=");
    expect(bulk).not.toContain("INSERT INTO public.lessons");
  });
});
