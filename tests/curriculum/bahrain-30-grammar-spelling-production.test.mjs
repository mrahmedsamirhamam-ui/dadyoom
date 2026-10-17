import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const manifest=JSON.parse(readFileSync("data/curriculum-completeness/bahrain-30-grammar-spelling-production-20261017.json","utf8"));
describe("Bahrain 30 source-scoped production lesson remediation manifest",()=>{
 test("has exact unique IDs and real stated grade breakdown",()=>{
  expect(manifest.ids).toHaveLength(30);
  expect(new Set(manifest.ids).size).toBe(30);
  expect(manifest.ids.every(id=>/^[a-f0-9-]{36}$/.test(id))).toBe(true);
  expect(Object.values(manifest.grades).reduce((a,b)=>a+b,0)).toBe(30);
 });
 test("does not mistake original enrichment for government book verification",()=>{
  expect(manifest.remediation).toMatch(/NOT textbook TOC certification/);
  expect(manifest.before_generic-manifest.after_generic).toBe(30);
  expect(manifest.baseline_generic-manifest.after_generic).toBe(105);
  expect(manifest.published_bahrain).toBe(1755);
 });
});