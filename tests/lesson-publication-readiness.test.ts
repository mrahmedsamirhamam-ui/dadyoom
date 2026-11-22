import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  REVIEW_REQUIRED_DESCRIPTION,
  needsSourcePublicationReview,
  publicLessonDescription,
} from "@/lib/lesson-content/publication-readiness";

const instructions = [
  { kind: "activities", items: [{ title: "فهم" }] },
  { kind: "dadyoom_source", source_publication_ready: false },
];

describe("official-curriculum transparency", () => {
  it("detects an explicit not-ready source marker even in a mixed instruction array", () => {
    expect(needsSourcePublicationReview(instructions)).toBe(true);
    expect(needsSourcePublicationReview(null)).toBe(false);
    expect(needsSourcePublicationReview([{kind:"dadyoom_source",source_publication_ready:true}])).toBe(false);
  });

  it("never repeats a misleading official summary for explicitly unready enrichment", () => {
    expect(publicLessonDescription("محتوى رسمي من كتاب الوزارة", instructions))
      .toBe(REVIEW_REQUIRED_DESCRIPTION);
    expect(REVIEW_REQUIRED_DESCRIPTION).toContain("قيد المراجعة");
    expect(REVIEW_REQUIRED_DESCRIPTION).toContain("ليست نقلًا معتمدًا");
  });

  it("keeps the existing ordinary lesson summary when no explicit unready marker exists", () => {
    expect(publicLessonDescription("شرح تمهيدي لدرس اللغة العربية", []))
      .toBe("شرح تمهيدي لدرس اللغة العربية");
  });

  it("keeps the source review list behind explicit admin authorization", () => {
    const page = readFileSync(resolve(process.cwd(), "app/admin/curriculum/source-review/page.tsx"), "utf8");
    expect(page).toContain("session.auth.getUser()");
    expect(page).toContain('profile?.role?.trim().toLowerCase() !== "admin"');
    expect(page).toContain('source_publication_ready: false');
    expect(page).toContain('count: "exact"');
    expect(page).toContain('href={`/lessons/${lesson.id}`}');
  });

  it("prevents source-unready lessons from advertising official readiness to search engines", () => {
    const page = readFileSync(resolve(process.cwd(), "app/lessons/[id]/page.tsx"), "utf8");
    const sitemap = readFileSync(resolve(process.cwd(), "app/sitemap.ts"), "utf8");
    expect(page).toContain("sourceReviewRequired");
    expect(page).toContain("(initialCompleted ? 100 : 0)");
    expect(page).toContain("robots: { index: false, follow: true }");
    expect(page).toContain("!sourceReviewRequired && Array.isArray(lesson.learning_objectives)");
    expect(page).toContain("instructions={sourceReviewRequired ? [] : lesson.instructions}");
    expect(sitemap).toContain("needsSourcePublicationReview(lesson.instructions)");
  });
});
