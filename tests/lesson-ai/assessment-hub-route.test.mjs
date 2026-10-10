import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
const load = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
test("student assessment link has a real bilingual landing route", () => {
  const hub = load("app/assessment/page.tsx");
  const student = load("app/(dashboard)/student/page.tsx");
  expect(student).toContain('href="/assessment"');
  expect(hub).toContain("export default function AssessmentHubPage()");
  expect(hub).toContain("LocalizedText");
  expect(hub).toContain('href="/courses"');
  expect(hub).toContain('href="/student"');
  expect(hub).toContain("index: false");
});
test("lesson-scoped assessment and book-reference safeguards remain intact", () => {
  const lesson = load("app/assessment/[lessonId]/page.tsx");
  expect(lesson).toContain("isKnownBookReferenceId(lessonId)");
  expect(lesson).toContain("LessonAssessment");
  expect(lesson).toContain("lessonId={lessonId}");
  expect(lesson).toContain("/curriculum/books/");
});
test("SEO retries only temporary HTTP failures and still fails persistent errors", () => {
  const ci = load(".github/workflows/seo-production-gate.yml");
  expect(ci).toContain("for attempt in 1 2 3");
  expect(ci).toContain("SEO_DISTRIBUTED=RETRY_HTTP");
  expect(ci).toContain("SEO_DISTRIBUTED=FAIL_HTTP");
  expect(ci).toContain('if [[ "$code" != "200" ]]');
});
