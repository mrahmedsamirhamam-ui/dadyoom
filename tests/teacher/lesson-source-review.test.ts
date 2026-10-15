import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { lessonNeedsSourceReview } from "../../lib/curriculum/lesson-source-review";

describe("AI teacher studio preserves source integrity", () => {
  test("flags imported generic lessons and unresolved OCR", () => {
    expect(lessonNeedsSourceReview("يتناول هذا الدرس موضوع «أسماء الإشارة»")).toBe(true);
    expect(lessonNeedsSourceReview("ملاحظة: مدخل OCR غير محسوم")).toBe(true);
    expect(lessonNeedsSourceReview("شرح متسلسل موثق من درس النحو")).toBe(false);
    expect(lessonNeedsSourceReview("")).toBe(false);
  });
  test("server refuses unacknowledged flagged source BEFORE invoking AI", () => {
    const server = readFileSync("app/api/teacher/lesson-pack/route.ts", "utf8");
    expect(server).toContain("lessonNeedsSourceReview(lesson.content)");
    expect(server).toContain("body.acknowledgeUnverified !== true");
    expect(server).toContain("status: 409");
    expect(server.indexOf("status: 409")).toBeLessThan(server.indexOf("await runAgentJson<LessonPack>"));
    expect(server).toContain("مادة إثرائية");
  });
  test("teacher must explicitly acknowledge and is not auto-opted in", () => {
    const ui = readFileSync("app/(dashboard)/teacher/studio/TeacherLessonPackClient.tsx", "utf8");
    expect(ui).toContain("setSourceReviewNeeded(true)");
    expect(ui).toContain("setSourceReviewAccepted(false)");
    expect(ui).toContain("sourceReviewNeeded && sourceReviewAccepted");
    expect(ui).toContain("sourceReviewNeeded && !sourceReviewAccepted");
    expect(ui).toContain("checked={sourceReviewAccepted}");
  });
});
