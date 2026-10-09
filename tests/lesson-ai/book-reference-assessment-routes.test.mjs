import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
const get = (path) => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
it("redirects book reference assessment, games and study pages", () => {
  for (const path of [
    "app/assessment/[lessonId]/page.tsx",
    "app/lessons/[id]/games/page.tsx",
    "app/lessons/[id]/study/page.tsx",
  ]) {
    const code=get(path);
    expect(code).toContain("isKnownBookReferenceId(");
    expect(code).toContain("redirect(`/curriculum/books/");
    expect(code.indexOf("isKnownBookReferenceId(")).toBeLessThan(code.indexOf("await createClient()") === -1 ? code.length : code.indexOf("await createClient()"));
  }
});
it("guards book assessment session and expensive generated assessments", () => {
  const session=get("app/api/ai/assessment/session/route.ts");
  const generated=get("app/api/ai/assessment/route.ts");
  expect(session.indexOf("isKnownBookReferenceId(lessonId)")).toBeLessThan(session.indexOf("startAssessmentSession({"));
  expect(generated.indexOf("isKnownBookReferenceId(lessonId)")).toBeLessThan(generated.indexOf('new GoogleGenAI'));
});
it("guards existing assessment submissions and sessions before mutations", () => {
  const submit=get("app/api/ai/assessment/submit/route.ts");
  const next=get("app/api/ai/assessment/next/route.ts");
  expect(submit.indexOf("isKnownBookReferenceId(assessment.lesson_id)")).toBeLessThan(submit.indexOf(".update({"));
  expect(next.indexOf("isKnownBookReferenceId(existingSession.lesson_id)")).toBeLessThan(next.indexOf("advanceAssessmentSession({"));
  expect(submit).toContain("status: 409");
  expect(next).toContain("status: 409");
});
