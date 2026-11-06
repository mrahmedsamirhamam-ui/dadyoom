import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  REVIEW_REQUIRED_DESCRIPTION,
  hasExplicitNonMinistryContentNotice,
  needsSourcePublicationReview,
  publicLessonDescription,
} from "../lib/lesson-content/publication-readiness";

describe("Honest source disclosures in student lessons and SEO", () => {
  it("keeps an explicit server-reviewed source record private until approved", () => {
    expect(needsSourcePublicationReview([{ kind:"dadyoom_source",source_publication_ready:false }])).toBe(true);
    expect(needsSourcePublicationReview([{ kind:"dadyoom_source",source_publication_ready:true }])).toBe(false);
    expect(needsSourcePublicationReview([])).toBe(false);
  });

  it("detects an original reading substitute even with no instructions marker", () => {
    const text = "هذه قراءة أصلية جديدة من تأليف ضاديوم وليست نص الكتاب الرسمي أو قصيدته.";
    expect(hasExplicitNonMinistryContentNotice(text)).toBe(true);
    expect(needsSourcePublicationReview(null,text)).toBe(true);
    expect(publicLessonDescription("هذه هي قراءة الكتاب المعتمدة", null, text))
      .toBe(REVIEW_REQUIRED_DESCRIPTION);
  });

  it("detects an explicitly original worksheet with Arabic diacritics", () => {
    const text = "تنبيه تحريري: هذا إثراء تعليمي أصلي من ضاديوم، وليس نقلًا من كتاب الوزارة.";
    expect(hasExplicitNonMinistryContentNotice(text)).toBe(true);
    expect(needsSourcePublicationReview([],text)).toBe(true);
  });

  it("detects a poem disclaimer without implying an original poem is Ministry text", () => {
    const text = "هذا النص والمقطوعة من تأليف ضاديوم، ولا يمثلان قصيدة الكتاب الوزاري.";
    expect(hasExplicitNonMinistryContentNotice(text)).toBe(true);
    expect(publicLessonDescription("قصيدة الكتاب بالكامل", [], text))
      .toBe(REVIEW_REQUIRED_DESCRIPTION);
  });

  it("does not treat ordinary content as approved or as a substitute merely for mentioning the book", () => {
    const safe = "أتعلّم حرف الباء. هذا تدريب على النطق وليس بيانًا بمطابقة متن الكتاب.";
    expect(hasExplicitNonMinistryContentNotice(safe)).toBe(false);
    expect(hasExplicitNonMinistryContentNotice(null)).toBe(false);
    expect(needsSourcePublicationReview([], safe)).toBe(false);
    expect(publicLessonDescription("شرح الحرف", [], safe)).toBe("شرح الحرف");
  });

  it("wires the content-aware source note to the lesson UI and metadata noindex gate", () => {
    const page=readFileSync("app/lessons/[id]/page.tsx","utf8");
    expect(page).toContain('.select("title,summary,instructions,content")');
    expect(page).toContain("needsSourcePublicationReview(data.instructions, data.content)");
    expect(page).toContain("needsSourcePublicationReview(lesson.instructions, lesson.content)");
    expect(page).toContain("publicLessonDescription(lesson.summary, lesson.instructions, lesson.content)");
    expect(page).toContain("robots: { index: false, follow: true }");
    expect(page).toContain('role="status"');
    const studio = readFileSync("app/lessons/[id]/study/page.tsx", "utf8");
    expect(studio).toContain('.select("id,title,summary,content,instructions")');
    expect(studio).toContain("needsSourcePublicationReview(lesson.instructions, lesson.content)");
    expect(studio).toContain("robots: { index: false, follow: true }");
    expect(studio).toContain('role="status"');
    expect(studio).toContain("summary: sourceReviewRequired ? safeDescription : lesson.summary");
  });
});
