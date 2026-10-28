import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(process.cwd(),"app/lessons/[id]/page.tsx"),"utf8");

describe("public lesson access does not show private widgets as 401 errors", () => {
  it("renders the full lesson to anonymous visitors while withholding private tools", () => {
    expect(page).toContain("const bundle =");
    expect(page).toContain("getLessonPageBundle(id)");
    expect(page).toContain("<LessonLearningSlides");
    expect(page).toContain("<InteractiveLessonActivities");
    expect(page).toContain("الشرح والأنشطة المفتوحة متاحة للجميع");
    const privateStart=page.indexOf("        {user ? (\n          <>\n            <LessonSemanticSearch");
    const mastery=page.indexOf("<LessonMasteryCard",privateStart);
    expect(privateStart).toBeGreaterThan(-1);
    expect(mastery).toBeGreaterThan(privateStart);
    expect(page).toContain('<Link href="/login"');
  });
  it("does not show an unearned ScoreCard or private mastery to signed-out users", () => {
    expect(page).toContain("{user && multipleChoiceQuestions.length > 0 ? (");
    expect(page).toContain("{user ? (\n          <>\n            <LessonSemanticSearch");
  });
});
