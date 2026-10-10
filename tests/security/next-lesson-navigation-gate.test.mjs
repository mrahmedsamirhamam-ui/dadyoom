import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("next lesson production QA waits for user-visible page readiness", () => {
  const src = readFileSync("scripts/final-e2e-release-gate.mjs", "utf8");
  const section = src.slice(src.indexOf('  // A functional SSR document can keep background requests open.'));
  const next = section.slice(0, section.indexOf('  console.log(\n    "E2E_NEXT_LESSON=PASS"'));
  test("does not block on networkidle and checks final route, HTTP 200, and heading", () => {
    expect(next).not.toContain('waitUntil: "networkidle"');
    expect(next).toContain('waitUntil: "domcontentloaded"');
    expect(next).toContain('getByRole("heading", { level: 1 })');
    expect(next).toContain('nextLessonResponse?.status() === 200');
    expect(next).toContain('nextLessonBody.includes(nextLesson.title)');
  });
  test("does not conceal a 404, unexpected redirect or persistent 5xx", () => {
    expect(next).toContain('[0, 429, 502, 503, 504].includes(status)');
    expect(next).toContain('finalPath === expectedNextPath');
    expect(next).toContain('if (!transient || attempt === 3)');
    expect(next).toContain('E2E_NEXT_LESSON_NAV_FAILED');
    expect(next).toContain('"next-lesson-navigation"');
    expect(next).toContain('!hasClientErrorShell');
  });
});
