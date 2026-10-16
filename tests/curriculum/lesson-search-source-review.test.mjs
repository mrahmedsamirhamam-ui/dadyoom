import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { lessonNeedsSourceReview } from "../../lib/curriculum/lesson-source-review";

const api=readFileSync("app/api/lessons/search/route.ts","utf8");
const widget=readFileSync("components/search/LessonSearchClient.tsx","utf8");

describe("Public lesson lens explains genuine versus source-unverified resources",()=>{
  test("matches the same published lesson source review contract already used on lesson pages",()=>{
    expect(lessonNeedsSourceReview("يتناول هذا الدرس موضوع «قراءة» ثم تدريب مستقل")).toBe(true);
    expect(lessonNeedsSourceReview("درس نموذجي\n\nمدخل OCR غير محسوم")).toBe(true);
    expect(lessonNeedsSourceReview("درس أصلي عن المفعول به يتضمن مثالًا وتطبيقًا")).toBe(false);
    expect(api).toContain('import { lessonNeedsSourceReview }');
    expect(api).toContain('sourceReviewRequired: resourceKind === "lesson" && lessonNeedsSourceReview(item.content)');
  });
  test("does not give a scope, book reference, or review-pending enrichment a fake official lesson label",()=>{
    expect(api).toContain("      resourceKind,");
    expect(api).toContain('isKnownBookReferenceId(item.id)');
    expect(api).toContain('isCurriculumScopeRecord({ summary: item.summary, content: item.content })');
    expect(widget).toContain('lesson.resourceKind === "lesson" && lesson.sourceReviewRequired');
    expect(widget).toContain('تدريب ضاديوم — عنوان المصدر يحتاج مراجعة');
    expect(widget).toContain('افتح التدريب مع تنبيه مراجعة المصدر');
  });
});
