import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Draft = {
 lesson_id: string;
 grade: number;
 questions: number;
 activities: number;
 content_chars: number;
 review_class: string;
 ready_to_publish: boolean;
 learner_history: boolean;
};
const report=JSON.parse(readFileSync(resolve(process.cwd(),
 "data/curriculum-audits/bh-g23-57-drafts-classification-20261031.json"),"utf8")) as {
 snapshotDate:string; total:number; probableImportPlaceholders:number;
 enrichedDrafts:number; records:Draft[]; defaultAction:string;
};

describe("Bahrain grades 2-3 editorial quarantine of archived OCR imports",()=>{
 it("preserves 57 distinct records, rather than auto-publishing OCR artifacts",()=>{
  expect(report.total).toBe(57);
  expect(report.records).toHaveLength(57);
  expect(new Set(report.records.map(x=>x.lesson_id)).size).toBe(57);
  expect(report.records.every(x=>x.grade===2||x.grade===3)).toBe(true);
  expect(report.records.every(x=>!x.ready_to_publish)).toBe(true);
  expect(report.defaultAction).toContain("Preserve unpublished");
 });
 it("separates likely import placeholders from rich draft lessons for teacher review",()=>{
  const placeholders=report.records.filter(x=>x.review_class==="probable_import_placeholder_do_not_publish");
  const enriched=report.records.filter(x=>x.review_class==="enriched_draft_needs_title_textbook_and_teacher_review");
  expect(placeholders).toHaveLength(26);
  expect(enriched).toHaveLength(31);
  expect(report.probableImportPlaceholders).toBe(placeholders.length);
  expect(report.enrichedDrafts).toBe(enriched.length);
  expect(placeholders.every(x=>x.questions===0&&x.activities===0&&x.content_chars<=250)).toBe(true);
  expect(enriched.every(x=>x.questions>=3&&x.activities>=3)).toBe(true);
 });
});
