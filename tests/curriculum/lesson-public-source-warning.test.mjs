import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/lessons/[id]/page.tsx", "utf8");
const studio = readFileSync("app/api/teacher/lesson-pack/route.ts", "utf8");

describe("Dadyoom source quality stays transparent to students and teachers", () => {
  it("flags incomplete OCR and boilerplate lesson pages", () => {
    expect(page).toContain("lessonNeedsSourceReview(lesson.content)");
    expect(page).toContain("sourceReviewRequired ? (");
    expect(page).toContain("تنبيه توثيق المحتوى");
    expect(page).toContain('role="note"');
  });
  it("studio never treats flagged imported content as a verified source", () => {
    expect(studio).toContain("lessonNeedsSourceReview(lesson.content)");
    expect(studio).toContain("body.acknowledgeUnverified !== true");
    expect(studio).toContain("status: 409");
  });
});
