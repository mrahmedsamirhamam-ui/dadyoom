import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
const read=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");
const official=JSON.parse(read("data/curriculum-audits/bahrain-official-semester1-2026-2027-grades2-3-reading-index.json")) as {
 sourceUrl:string;schoolYear:string;term:string;
 topics:{grade:number;ordinal:number;title:string;bookPages:string;genre:string}[];
};
const quarantine=JSON.parse(read("data/curriculum-audits/bahrain-grade2-3-ocr-scaffolds-quarantine-20261028.json")) as {
 published_before:number;activities_before:number;question_rows_retained:number;
 official_reading_poetry_topics_verified:number;no_student_attempts_or_progress:boolean;
 rows:{id:string;grade:number;title:string;status:string;activityCount:number;questionCount:number}[];
};
const auditSql=read("scripts/curriculum-bh-grade2-3-ocr-quarantine-readonly.sql");
describe("2026–27 Bahrain official Arabic reading TOC and reversible OCR quarantine",()=>{
 it("maps exactly the verified 10 Grade-2 and 12 Grade-3 semester-one official title references",()=>{
  expect(official.sourceUrl).toBe("https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf");
  expect(official.schoolYear).toBe("2026-2027");
  expect(official.term).toBe("semester_1");
  expect(official.topics).toHaveLength(22);
  expect(official.topics.filter(x=>x.grade===2)).toHaveLength(10);
  expect(official.topics.filter(x=>x.grade===3)).toHaveLength(12);
  expect(new Set(official.topics.map(x=>x.grade+"-"+x.ordinal)).size).toBe(22);
  for(const t of official.topics){
   expect(t.title.length).toBeGreaterThan(4);
   expect(t.bookPages).toMatch(/^\d+-\d+$/);
   expect(["poem","reading"]).toContain(t.genre);
  }
 });
 it("documents 26 previously published unused OCR-derived records without deleting their source IDs",()=>{
  expect(quarantine.published_before).toBe(26);
  expect(quarantine.activities_before).toBe(78);
  expect(quarantine.question_rows_retained).toBe(78);
  expect(quarantine.official_reading_poetry_topics_verified).toBe(22);
  expect(quarantine.no_student_attempts_or_progress).toBe(true);
  expect(quarantine.rows).toHaveLength(26);
  expect(new Set(quarantine.rows.map(x=>x.id)).size).toBe(26);
  for(const l of quarantine.rows){
   expect([2,3]).toContain(l.grade);
   expect(l.status).toBe("published");
   expect(l.activityCount).toBe(3);
   expect(l.questionCount).toBe(3);
  }
 });
 it("ships an auditable SQL that only reads the exact snapshot UUIDs",()=>{
  for(const l of quarantine.rows){
   expect(auditSql).toContain("'"+l.id+"'::uuid");
  }
  const sql=auditSql.replace(/--[^\n]*/g,"");
  expect(sql).toMatch(/\bWITH target\(id\) AS\s*\(\s*VALUES/i);
  expect(sql).toContain("FROM scope");
  expect(sql).toContain("still_exposed_activities");
  expect(sql).toContain("recorded_progress");
  expect(sql).not.toMatch(/\b(?:UPDATE|INSERT|DELETE|TRUNCATE|ALTER|DROP|REVOKE|GRANT)\b/i);
 });
});
