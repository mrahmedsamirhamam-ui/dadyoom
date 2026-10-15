import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const lesson = readFileSync("app/lessons/[id]/page.tsx", "utf8");
const quality = readFileSync("lib/curriculum/lesson-source-review.ts", "utf8");
const national = readFileSync("app/admin/curriculum/page.tsx", "utf8");

describe("Original Dadyoom enrichment is never marketed as a ministry textbook", () => {
  test("lesson page clearly distinguishes original content from textbook quotations", () => {
    expect(lesson).toContain('startsWith("درس ضاديوم الأصلي:")');
    expect(lesson).toContain('data-lesson-source-kind="dadyoom-original"');
    expect(lesson).toContain("محتوى إثرائي أصلي من ضاديوم");
    expect(lesson).toContain("وليس نصًا منقولًا من كتاب وزارة التربية والتعليم");
    expect(lesson).toContain("لا يُعد ظهوره في دولة أو صف إثباتًا لمطابقته");
  });
  test("existing OCR and generic-lesson warning remains a separate safeguard", () => {
    expect(lesson).toContain("sourceReviewRequired ? (");
    expect(lesson).toContain("lessonNeedsSourceReview(lesson.content)");
    expect(quality).toContain("مدخل OCR غير محسوم");
    expect(quality).toContain("يتناول هذا الدرس موضوع «");
  });
  test("national curriculum index does not equate supported with complete", () => {
    expect(national).toContain("«مدعوم» لا يعني «مكتمل»");
    expect(national).toContain("ليس شهادة مطابقة للكتب");
  });
});
