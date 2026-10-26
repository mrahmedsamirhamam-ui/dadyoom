import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
const get=(p:string)=>JSON.parse(read(p));
const source=get("data/curriculum-sources/bh-g7-s1-2026-ministry-plan-index.json");
const spelling=get("data/curriculum-drafts/bh-g7-s1-original-spelling-and-handwriting.json");
const writing=get("data/curriculum-drafts/bh-g7-s1-original-writing-workshops.json");
const region=get("data/curriculum-sources/arab-22-curriculum-source-review.json");
const countries=get("data/curriculum-packs/arab-countries.json");
describe("Bahrain Grade 7 original spelling, handwriting and composition: never auto-publish",()=>{
 it("follows 11 official source headings with one unique authored dictation each and 44 explained MCQ keys",()=>{
  expect(source.spellingAndHandwritingTopics).toHaveLength(11);
  expect(spelling.practices).toHaveLength(11);
  expect(spelling.practices.map((x:any)=>x.officialTopic)).toEqual(source.spellingAndHandwritingTopics.map((x:any)=>x.title));
  expect(new Set(spelling.practices.map((x:any)=>x.dictationPrompt)).size).toBe(11);
  const balance={a:0,b:0,c:0};
  for(const [i,p] of spelling.practices.entries()){
   expect(p.sourceOrder).toBe(i+1);
   expect(p.week).toBe(source.spellingAndHandwritingTopics[i].week);
   expect(p.content.length).toBeGreaterThan(900);
   expect(p.examples).toHaveLength(3);
   expect(p.objectives).toHaveLength(4);
   expect(p.questions).toHaveLength(4);
   expect(p.publicationApproved).toBe(false);
   expect(p.handwriting.traceSheetRendered).toBe(false);
   expect(p.handwriting.letterFormationModelVerified).toBe(false);
   expect(p.handwriting.visualStrokeTemplateVerified).toBe(false);
   expect(p.source.textbookPageStart).toBeNull();
   expect(p.source.visualTableVerification).toBe("pending");
   for(const [j,q] of p.questions.entries()){
    expect(q.cognitiveLevel).toBe(["remember","understand","analyze","apply"][j]);
    expect(q.options.map((o:any)=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map((o:any)=>o.text)).size).toBe(3);
    expect(q.options.filter((o:any)=>o.id===q.correctAnswer)).toHaveLength(1);
    expect(q.explanation.length).toBeGreaterThan(90);
    balance[q.correctAnswer as keyof typeof balance]++;
   }
  }
  expect(Object.values(balance).reduce((a,b)=>a+b,0)).toBe(44);
  expect(Math.max(...Object.values(balance))).toBeLessThan(17);
 });
 it("has 9 differentiated writing workshops, each with independent learner response and teacher-only 12-point rubric",()=>{
  expect(source.writingTopics).toHaveLength(9);
  expect(writing.practices.map((x:any)=>x.officialTopic)).toEqual(source.writingTopics.map((x:any)=>x.title));
  expect(new Set(writing.practices.map((x:any)=>x.teaching.prompt)).size).toBe(9);
  expect(writing.practices.map((x:any)=>x.genre)).toContain("event_report");
  expect(writing.practices.map((x:any)=>x.genre)).toContain("invitation_card");
  for(const [i,p] of writing.practices.entries()){
   expect(p.sourceOrder).toBe(i+1);
   expect(p.week).toBe(source.writingTopics[i].week);
   expect(p.teaching.originalTeacherModel.length).toBeGreaterThan(95);
   expect(p.teaching.planningSteps).toHaveLength(3);
   expect(p.teaching.modelIsNotMandatoryStudentAnswer).toBe(true);
   expect(p.assessment.mode).toBe("human_teacher_review_only");
   expect(p.assessment.automaticFreeTextGrade).toBe(false);
   expect(p.assessment.totalRubricPoints).toBe(12);
   expect(p.rubric.reduce((sum:number,r:any)=>sum+r.max,0)).toBe(12);
   expect(p.publicationApproved).toBe(false);
   expect(p.source.visualTableVerification).toBe("pending");
  }
 });
 it("keeps original content unpublished without misleading official textbook claims",()=>{
  for(const p of [spelling,writing]){
   expect(p.rights).toEqual({contentOwner:"dadyoom",officialTextbookBodyVerified:false,publicationApproved:false,teacherReview:"pending"});
   expect(p.countryCode).toBe("BH");expect(p.grade).toBe(7);
   expect(p.sourceIndex).toBe("data/curriculum-sources/bh-g7-s1-2026-ministry-plan-index.json");
  }
  expect(source.review.publicationApproved).toBe(false);
 });
});
describe("22 Arab-country official-source verification boundary",()=>{
 it("keeps every distinct Arab country without inventing 21 official source URLs or passing readiness by row counts",()=>{
  expect(countries.countries).toHaveLength(22);
  expect(region.countrySourceReview).toHaveLength(22);
  expect(new Set(region.countrySourceReview.map((c:any)=>c.code)).size).toBe(22);
  expect(region.countrySourceReview.map((c:any)=>c.code).sort()).toEqual(countries.countries.map((c:any)=>c.code).sort());
  for(const c of region.countrySourceReview){
   expect(c.coverageReady).toBe(false);
   expect(c.publicationApproved).toBe(false);
   expect(c.teacherReview).toBe("pending");
   expect(c.textbookContentsCompared).toBe(false);
   if(c.code!=="BH")expect(c.verifiedPlanUrl).toBeNull();
  }
  expect(region.safeguards.noProductionWrites).toBe(true);
  expect(region.safeguards.noAutomaticTranslationOrCountryClone).toBe(true);
 });
 it("global audit remains SELECT-only and never exposes student data or answer keys",()=>{
  const sql=read("scripts/arab-22-curriculum-readonly-audit.sql");
  expect(sql).toMatch(/SELECT\s+country_code/i);
  expect(sql).toMatch(/student_progress_without_lesson/);
  expect(sql).not.toMatch(/\b(?:UPDATE|INSERT|DELETE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\s+(?:TABLE\s+)?(?:public\.)?[a-z_]+/i);
  expect(sql).not.toMatch(/correct_answer|student_id|user_id|selected_answer/i);
 });
});
