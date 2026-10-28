import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
const a="data/curriculum-drafts/bahrain-grade2-official-review-nine-original-repairs-20261028.json";
const b="data/curriculum-audits/bahrain-grade2-five-duplicate-review-ocr-quarantine-20261028.json";
const q="scripts/curriculum-bahrain-grade2-review-repaired-and-ocr-quarantine-readonly.sql";
const raw=readFileSync(resolve(process.cwd(),a),"utf8");
const lessons=JSON.parse(raw) as {year:string;term:string;containsAnswerKeys:boolean;lessons:{
 id:string;grade:number;code:string;sequence:number;title:string;originalExample:string;
 content:string;learningObjectives:string[];vocabulary:{word:string;meaning:string}[];
 questions:{order:number;question:string;options:{id:string;text:string}[]}[];openInstructions:string;
}[]};
const snap=JSON.parse(readFileSync(resolve(process.cwd(),b),"utf8")) as {
 quarantineCount:number;publishedActivitiesToDisable:number;questionsRetained:number;learnerWorkFound:boolean;
 rows:{id:string;title:string;priorStatus:string;questions:number;activities:number}[];
};
const sql=readFileSync(resolve(process.cwd(),q),"utf8");
describe("Bahrain Grade-2 official 2026–27 review source integrity",()=>{
 it("covers nine genuine original review skill lessons, excluding the separately authored fourth letter review",()=>{
  expect(lessons.year).toBe("2026-2027");
  expect(lessons.term).toBe("semester1");
  expect(lessons.lessons).toHaveLength(9);
  expect(lessons.lessons.map(x=>x.sequence)).toEqual([1,2,3,4,5,6,7,8,10]);
  expect(new Set(lessons.lessons.map(x=>x.id)).size).toBe(9);
  for(const lesson of lessons.lessons){
   expect(lesson.grade).toBe(2);
   expect(lesson.code).toBe("BH");
   expect(lesson.originalExample.length).toBeGreaterThan(130);
   expect(lesson.content).toContain(lesson.originalExample);
   expect(lesson.content).toContain("هذا تدريب جديد لا ينقل نص الكتاب");
   expect(lesson.content).toContain("نشاط الدعم:");
   expect(lesson.content).toContain("نشاط التطبيق:");
   expect(lesson.content).toContain("نشاط التحدي:");
   expect(lesson.learningObjectives).toHaveLength(3);
   expect(lesson.learningObjectives.every(o=>o.startsWith("أن "))).toBe(true);
   expect(lesson.vocabulary).toHaveLength(3);
   expect(lesson.questions).toHaveLength(3);
   expect(lesson.questions.map(x=>x.order)).toEqual([1,2,3]);
   expect(lesson.questions.every(q=>q.options.map(o=>o.id).join("")==="abc"
    &&new Set(q.options.map(o=>o.text)).size===3)).toBe(true);
  }
 });
 it("does not publish any answer key or teacher model responses",()=>{
  expect(lessons.containsAnswerKeys).toBe(false);
  expect(raw).not.toMatch(/"correctAnswer"\s*:|"correct_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:/);
 });
 it("snapshots five unused duplicates with original IDs and does not delete them",()=>{
  expect(snap.quarantineCount).toBe(5);
  expect(snap.publishedActivitiesToDisable).toBe(15);
  expect(snap.questionsRetained).toBe(15);
  expect(snap.learnerWorkFound).toBe(false);
  expect(snap.rows).toHaveLength(5);
  expect(new Set(snap.rows.map(x=>x.id)).size).toBe(5);
  expect(snap.rows.every(x=>x.priorStatus==="published"&&x.questions===3&&x.activities===3)).toBe(true);
  for(const lesson of [...lessons.lessons,...snap.rows]) expect(sql).toContain("'"+lesson.id+"'::uuid");
  expect(sql.replace(/--[^\n]*/g,"")).not.toMatch(/\b(?:UPDATE|INSERT|DELETE|TRUNCATE|ALTER|DROP|REVOKE|GRANT)\b/i);
  expect(sql).toContain("quarantined_still_exposed_activities");
  expect(sql).toContain("repaired_valid_key_references");
 });
});
