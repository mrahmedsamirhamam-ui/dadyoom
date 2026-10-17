import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const data=JSON.parse(readFileSync("data/curriculum-completeness/bahrain-30-original-reading-production-20261017.json","utf8"));
describe("Bahrain 30 real original reading passages batch",()=>{
 test("all 30 IDs are distinct and class appropriate",()=>{
  expect(data.rows).toHaveLength(30);
  expect(new Set(data.rows.map(r=>r.id)).size).toBe(30);
  expect(data.counts.grade4+data.counts.grade5+data.counts.grade6).toBe(30);
 });
 test("keeps government book completion unclaimed and source OCR scope outside",()=>{
  expect(data.book_toc_certified).toBe(false);
  expect(data.counts.remaining_generic).toBe(78);
 });
});