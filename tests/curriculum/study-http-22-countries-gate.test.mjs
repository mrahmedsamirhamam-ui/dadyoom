import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const script = readFileSync("scripts/smoke-study-22.mjs","utf8");
const workflow = readFileSync(".github/workflows/seo-production-gate.yml","utf8");
describe("Real 22-country HTTP student route launch gate",()=>{
 test("checks a grade in every country and both grade 13 routes",()=>{
  expect(script).toContain("ARAB_COUNTRY_CODES");
  expect(script).toContain("codes.length !== 22");
  expect(script).toContain('"/study/" + code.toLowerCase() + "/1"');
  expect(script).toContain('["mr", "tn"]');
  expect(script).toContain("response.ok");
  expect(script).toContain("required.every");
  expect(script).toContain('new Error("STUDY_22_PAGE=FAIL');
 });
 test("runs after verified deployment SHA, not just local build",()=>{
  expect(workflow.indexOf("Wait for canonical domain deployment")).toBeLessThan(workflow.indexOf("Verify 22-country student study pages in production"));
  expect(workflow).toContain("run: node scripts/smoke-study-22.mjs");
 });
});
