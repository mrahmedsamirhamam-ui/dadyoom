import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const manifest = JSON.parse(readFileSync("data/curriculum-completeness/bahrain-52-writing-production-20261017.json","utf8"));
describe("Bahrain 52 original writing lessons actual production remediation",()=>{
 test("all 52 referenced records unique, grade counts match",()=>{
  expect(manifest.count).toBe(52);
  expect(manifest.records).toHaveLength(52);
  expect(new Set(manifest.records.map(r=>r.id)).size).toBe(52);
  expect(manifest.grade_counts).toEqual({"4":21,"5":20,"6":7,"7":4});
 });
 test("preserves honest scope of the improvement",()=>{
  expect(manifest.generic_before-manifest.generic_after).toBe(52);
  expect(manifest.official_book_completeness_claim).toBe(false);
  expect((manifest.published_bh-manifest.generic_after)/manifest.published_bh).toBeGreaterThan(0.93);
 });
});