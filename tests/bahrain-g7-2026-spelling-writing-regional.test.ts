import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Topic={title:string;week:number};
type Question={cognitiveLevel:string;options:Array<{id:string;text:string}>;correctAnswer:"a"|"b"|"c";explanation:string};
type AuthoredPack<T>={
  practices:T[];countryCode:string;grade:number;sourceIndex:string;
  rights:{contentOwner:string;officialTextbookBodyVerified:boolean;publicationApproved:boolean;teacherReview:string};
};
type SpellingLesson={
  officialTopic:string;sourceOrder:number;week:number;content:string;examples:string[];objectives:string[];
  dictationPrompt:string;publicationApproved:boolean;questions:Question[];
  handwriting:{traceSheetRendered:boolean;letterFormationModelVerified:boolean;visualStrokeTemplateVerified:boolean};
  source:{textbookPageStart:number|null;visualTableVerification:string};
};
type WritingLesson={
  officialTopic:string;sourceOrder:number;week:number;genre:string;publicationApproved:boolean;
  teaching:{prompt:string;originalTeacherModel:string;planningSteps:string[];modelIsNotMandatoryStudentAnswer:boolean};
  source:{visualTableVerification:string};
  assessment:{mode:string;automaticFreeTextGrade:boolean;totalRubricPoints:number};
  rubric:Array<{max:number}>;
};
type RegionalReview={
  code:string;coverageReady:boolean;publicationApproved:boolean;teacherReview:string;
  textbookContentsCompared:boolean;verifiedPlanUrl:string|null;officialMinistryResourcePortal:string|null;portalEvidenceScope:string;gradeTermTextbookTocVerified:boolean;
};
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
const get=(p:string):unknown=>JSON.parse(read(p)) as unknown;
const source=get("data/curriculum-sources/bh-g7-s1-2026-ministry-plan-index.json") as {
  spellingAndHandwritingTopics:Topic[];writingTopics:Topic[];review:{publicationApproved:boolean};
};
const spelling=get("data/curriculum-drafts/bh-g7-s1-original-spelling-and-handwriting.json") as AuthoredPack<SpellingLesson>;
const writing=get("data/curriculum-drafts/bh-g7-s1-original-writing-workshops.json") as AuthoredPack<WritingLesson>;
const region=get("data/curriculum-sources/arab-22-curriculum-source-review.json") as {
  countrySourceReview:RegionalReview[];safeguards:{noProductionWrites:boolean;noAutomaticTranslationOrCountryClone:boolean};
};
const countries=get("data/curriculum-packs/arab-countries.json") as {countries:Array<{code:string}>};

describe("Bahrain Grade 7 original spelling, handwriting and composition: never auto-publish",()=>{
 it("follows 11 official source headings with one unique authored dictation each and 44 explained MCQ keys",()=>{
  expect(source.spellingAndHandwritingTopics).toHaveLength(11);
  expect(spelling.practices).toHaveLength(11);
  expect(spelling.practices.map(x=>x.officialTopic)).toEqual(source.spellingAndHandwritingTopics.map(x=>x.title));
  expect(new Set(spelling.practices.map(x=>x.dictationPrompt)).size).toBe(11);
  const balance={a:0,b:0,c:0};
  for(const [i,p] of spelling.practices.entries()){
   expect(p.sourceOrder).toBe(i+1);
   expect(p.week).toBe(source.spellingAndHandwritingTopics[i].week);
   expect(p.content.length).toBeGreaterThan(900);
   expect(p.examples.length).toBeGreaterThanOrEqual(3);
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
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.options.filter(o=>o.id===q.correctAnswer)).toHaveLength(1);
    expect(q.explanation.length).toBeGreaterThan(90);
    balance[q.correctAnswer]++;
   }
  }
  expect(Object.values(balance).reduce((a,b)=>a+b,0)).toBe(44);
  expect(Math.max(...Object.values(balance))).toBeLessThan(17);
 });
 it("has 9 differentiated writing workshops, each with independent learner response and teacher-only 12-point rubric",()=>{
  expect(source.writingTopics).toHaveLength(9);
  expect(writing.practices.map(x=>x.officialTopic)).toEqual(source.writingTopics.map(x=>x.title));
  expect(new Set(writing.practices.map(x=>x.teaching.prompt)).size).toBe(9);
  expect(writing.practices.map(x=>x.genre)).toContain("event_report");
  expect(writing.practices.map(x=>x.genre)).toContain("invitation_card");
  for(const [i,p] of writing.practices.entries()){
   expect(p.sourceOrder).toBe(i+1);
   expect(p.week).toBe(source.writingTopics[i].week);
   expect(p.teaching.originalTeacherModel.length).toBeGreaterThan(95);
   expect(p.teaching.planningSteps).toHaveLength(3);
   expect(p.teaching.modelIsNotMandatoryStudentAnswer).toBe(true);
   expect(p.assessment.mode).toBe("human_teacher_review_only");
   expect(p.assessment.automaticFreeTextGrade).toBe(false);
   expect(p.assessment.totalRubricPoints).toBe(12);
   expect(p.rubric.reduce((sum,r)=>sum+r.max,0)).toBe(12);
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
 it("accepts verified source leads without turning an unchecked book TOC into curriculum readiness",()=>{
  expect(countries.countries).toHaveLength(22);
  expect(region.countrySourceReview).toHaveLength(22);
  expect(new Set(region.countrySourceReview.map(c=>c.code)).size).toBe(22);
  expect(region.countrySourceReview.map(c=>c.code).sort()).toEqual(countries.countries.map(c=>c.code).sort());
  for(const c of region.countrySourceReview){
   expect(c.coverageReady).toBe(false);
   expect(c.publicationApproved).toBe(false);
   expect(c.teacherReview).toBe("pending");
   expect(c.textbookContentsCompared).toBe(false);
   if(c.code!=="BH")expect(c.verifiedPlanUrl).toBeNull();
  }
  expect(region.safeguards.noProductionWrites).toBe(true);
  expect(region.safeguards.noAutomaticTranslationOrCountryClone).toBe(true);
  const withMinistryEntry=region.countrySourceReview.filter(c=>c.officialMinistryResourcePortal!==null);
  expect(withMinistryEntry.length).toBeGreaterThanOrEqual(7);
  expect(new Set(withMinistryEntry.map(c=>c.code)).size).toBe(withMinistryEntry.length);
  for(const c of withMinistryEntry){
   const url=new URL(c.officialMinistryResourcePortal!);
   expect(url.protocol).toBe("https:");
   expect(url.hostname).not.toMatch(/(?:^|\\.)(?:example|localhost|invalid)(?:\\.|$)/);
   expect(c.portalEvidenceScope.length).toBeGreaterThan(18);
   expect(c.textbookContentsCompared).toBe(false);
   expect(c.coverageReady).toBe(false);
   expect(c.publicationApproved).toBe(false);
  }
  for(const c of region.countrySourceReview){
   expect(c.gradeTermTextbookTocVerified).toBe(false);
   if(c.officialMinistryResourcePortal)expect(c.officialMinistryResourcePortal).toMatch(/^https:\/\//);
  }
 });
 it("global audit remains SELECT-only and never exposes student data or answer keys",()=>{
  const sql=read("scripts/arab-22-curriculum-readonly-audit.sql");
  expect(sql).toMatch(/SELECT\s+country_code/i);
  expect(sql).toMatch(/student_progress_without_lesson/);
  const uncommentedSql=sql.replace(/--[^\n]*/g,"");
  expect(uncommentedSql).not.toMatch(/\b(?:UPDATE|INSERT|DELETE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\s+(?:TABLE\s+)?(?:public\.)?[a-z_]+/i);
  expect(sql).not.toMatch(/correct_answer|student_id|user_id|selected_answer/i);
 });
});
