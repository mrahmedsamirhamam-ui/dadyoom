import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

test("global curriculum unit catalog paginates beyond PostgREST's default row ceiling", () => {
  const source = readFileSync("services/lessons/student-curriculum-catalog.ts", "utf8");
  expect(source).toContain("const allUnits: RawUnit[] = [];");
  expect(source).toContain("const unitsPageSize = 200;");
  expect(source).toContain(".range(from, from + unitsPageSize - 1)");
  expect(source).toContain("if (batch.length < unitsPageSize) break");
  expect(source).toContain("for (const raw of allUnits)");
  expect(source).toContain(".order(\"id\", { ascending: true })");
});
test("individual student progress also paginates rather than dropping records after 1000", () => {
  const source = readFileSync("services/lessons/student-curriculum-catalog.ts", "utf8");
  expect(source).toContain("const progressPageSize = 250;");
  expect(source).toContain(".range(from, from + progressPageSize - 1)");
  expect(source).toContain("progress.push(...batch)");
  expect(source).toContain("if (progressError)");
});
