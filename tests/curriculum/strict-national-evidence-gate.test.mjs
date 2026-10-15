import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const registry = JSON.parse(readFileSync("data/secondary-tracks/arab-22-secondary-tracks-2026-2027.json", "utf8"));
const script = readFileSync("scripts/audit-strict-full-curriculum-coverage.mjs", "utf8");

describe("National official book completeness is evidence-based, not a registry label", () => {
  test("current 22-country secondary registry is not certified complete", () => {
    expect(registry.countries).toHaveLength(22);
    const r = spawnSync(process.execPath, ["scripts/audit-strict-full-curriculum-coverage.mjs"], {
      encoding: "utf8", timeout: 8000,
    });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("STRICT_FULL_COUNTRIES=0/22");
    expect(r.stderr).toContain("STRICT_FULL_COVERAGE_GATE=FAIL");
  });
  test("requires independently reviewed TOCs, editions, exact items and assessment", () => {
    expect(script).toContain("independentOfficialBookEvidence");
    expect(script).toContain('evidence.reviewState !== "approved"');
    expect(script).toContain("evidence.books.length !== evidence.expectedBookScopes");
    expect(script).toContain("book.sourceSha256");
    expect(script).toContain("item.textReviewed !== true");
    expect(script).toContain("item.objectivesReviewed !== true");
    expect(script).toContain("item.assessmentReviewed !== true");
    expect(script).toContain("!hasIncompleteSignal &&\n    bookEvidenceValid");
  });
  test("first-term detailed labels cannot pass the full official gate", () => {
    expect(script).not.toContain("detailed-current-s1-plus-current-book-s2|verified-full-current");
    expect(script).toContain("full-current-official|verified-full-current|lesson-level-complete");
  });
});
