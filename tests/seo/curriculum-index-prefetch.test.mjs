import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

// Do not prefetch hundreds of indexed lesson routes from large directory grids.
// All links remain real server-rendered anchors for students and Googlebot.
test("country and grade lesson lists disable speculative prefetch", () => {
  const directory = readFileSync("app/curriculum/page.tsx", "utf8");
  const country = readFileSync("app/curriculum/[country]/page.tsx", "utf8");
  const grade = readFileSync("app/curriculum/[country]/[grade]/page.tsx", "utf8");
  expect(directory).toMatch(/href=\{`\/curriculum\/\$\{country\.code\.toLowerCase\(\)\}`\}\s*prefetch=\{false\}/u);
  expect(country).toMatch(/href=\{\s*`\/lessons\/\$\{lesson\.id\}`\s*\}\s*prefetch=\{false\}/u);
  expect(country).toMatch(/href=\{`\/curriculum\/\$\{info\.code\.toLowerCase\(\)\}\/\$\{gradeNumber\}`\}\s*prefetch=\{false\}/u);
  expect(grade).toMatch(/href=\{`\/lessons\/\$\{lesson\.id\}`\}\s*prefetch=\{false\}/u);
});
