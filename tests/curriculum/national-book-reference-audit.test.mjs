import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const registry = readFileSync("lib/curriculum/verified-book-reference.ts", "utf8");
const audit = readFileSync("scripts/audit-22-country-live.mjs", "utf8");
const block = registry.match(
  /export const BOOK_REFERENCE_IDS:[\s\S]*?=\s*(\{[\s\S]*?\})\s*as const;/u
)?.[1];
if (!block) throw new Error("BOOK_REFERENCE_IDS_NOT_FOUND");
const knownIds = new Set(
  [...block.matchAll(/"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/giu)]
    .map((match) => match[1].toLowerCase())
);

describe("22-country lesson audit excludes known textbook title cards", () => {
  test("reads all known catalog card IDs from the existing registry", () => {
    expect(knownIds.size).toBe(30);
    expect(knownIds.has("f7314947-c47e-4506-92bc-e53b398f2e71")).toBe(true);
    expect(knownIds.has("409a3723-ac04-4b9f-828f-d78a6fa16f5d")).toBe(true);
  });
  test("counts a known catalog card without treating it as instructional", () => {
    const sample = [
      "f7314947-c47e-4506-92bc-e53b398f2e71",
      "7edbc90b-db11-4a44-9639-09beb1ba430b",
    ];
    const books = sample.filter((id) => knownIds.has(id)).length;
    expect(sample.length - books).toBe(1);
    expect(books).toBe(1);
  });
  test("live audit uses the registry, not duplicated hardcoded IDs", () => {
    expect(audit).toContain("lib/curriculum/verified-book-reference.ts");
    expect(audit).toContain("BOOK_REFERENCE_REGISTRY_UNREADABLE");
    expect(audit).toContain("knownBookReferenceIds.has(lesson.id.toLowerCase())");
    expect(audit).toContain("instructionalLessonCandidates");
    expect(audit).toContain("officialBookLessonCompleteness: \"NOT_VERIFIED\"");
  });
});
