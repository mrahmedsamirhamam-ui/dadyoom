import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
type Q={id:string;type:string;cognitiveLevel:string;question:string;options:Array<{id:string;text:string}>;correctAnswer:"a"|"b"|"c";explanation:string};
type L={existingLessonId:string;existingTitle:string;expectedLessonType:string;expectedGrade:number;expectedSemester:number;sourcePassageAnchor:string;objectives:string[];vocabulary:Array<{word:string;meaning:string;example:string;order:number}>;questions:Q[];publicationApproved:boolean;officialTocVerified:boolean;teacherReview:string;pedagogy:{opening:string;cooperative:string;differentiated:{support:string;core:string;extension:string};writingPerformance:string;rubric:Array<{max:number}>;openWritingGrading:string}};
const p=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-drafts/bh-g7-s2-original-existing-reading-enhancements.json"),"utf8")) as {countryCode:string;grade:number;semester:number;rights:{officialTextbookQuoted:boolean;sourceYearTextbookAlignment:string;publicationApproved:boolean;teacherReview:string};importSafety:{mode:string;linkExistingIdsOnly:boolean;matchSourcePassageBeforeImport:boolean;noNewLessonRecords:boolean;noProductionWrites:boolean;noLearnerProgressMutation:boolean;noAutomaticFreeTextGrading:boolean;requireTeacherSignoff:boolean};lessons:L[]};
describe("8 existing Bahrain Grade-7 reading lessons' original review material",()=>{
 it("keeps 8 IDs unique with 32 definitions, 32 questions, four Bloom cognitive levels",()=>{
  expect(p.countryCode).toBe("BH");expect(p.grade).toBe(7);expect(p.semester).toBe(2);
  expect(p.lessons).toHaveLength(8);
  expect(p.lessons.flatMap(l=>l.vocabulary)).toHaveLength(32);
  expect(p.lessons.flatMap(l=>l.questions)).toHaveLength(32);
  expect(new Set(p.lessons.map(l=>l.existingLessonId)).size).toBe(8);
  const counts={a:0,b:0,c:0};
  for(const [i,l] of p.lessons.entries()){
   expect(l.existingLessonId).toMatch(/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i);
   expect(l.expectedLessonType).toBe("reading");expect(l.expectedGrade).toBe(7);expect(l.expectedSemester).toBe(2);
   expect(l.sourcePassageAnchor.length).toBeGreaterThan(19);
   expect(l.teacherReview).toBe("pending");expect(l.publicationApproved).toBe(false);expect(l.officialTocVerified).toBe(false);
   expect(l.objectives).toHaveLength(4);
   expect(l.vocabulary.map(w=>w.order)).toEqual([1,2,3,4]);
   expect(new Set(l.vocabulary.map(w=>w.word)).size).toBe(4);
   for(const w of l.vocabulary){expect(w.meaning.length).toBeGreaterThan(17);expect(w.example.length).toBeGreaterThan(16);}
   expect(l.questions.map(q=>q.cognitiveLevel)).toEqual(["remember","understand","analyze","evaluate"]);
   for(const [j,q] of l.questions.entries()){
    expect(q.type).toBe("multiple_choice");expect(q.explanation.length).toBeGreaterThan(19);
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.correctAnswer).toBe("abc"[(i*4+j)%3]);counts[q.correctAnswer]++;
   }
   expect(l.pedagogy.opening).toContain(l.existingTitle);
   expect(l.pedagogy.rubric.reduce((s,r)=>s+r.max,0)).toBe(9);
   expect(l.pedagogy.openWritingGrading).toBe("human_teacher_only");
  }
  expect(Math.max(...Object.values(counts))-Math.min(...Object.values(counts))).toBeLessThanOrEqual(1);
 });
 it("denies ministry-edition completion and automatic publishing",()=>{
  expect(p.rights).toMatchObject({officialTextbookQuoted:false,sourceYearTextbookAlignment:"unverified",publicationApproved:false,teacherReview:"pending"});
  expect(p.importSafety).toMatchObject({mode:"review_only",linkExistingIdsOnly:true,matchSourcePassageBeforeImport:true,noNewLessonRecords:true,noProductionWrites:true,noLearnerProgressMutation:true,noAutomaticFreeTextGrading:true,requireTeacherSignoff:true});
 });
 it("validates 8 existing source anchors and title/year/term through read-only SQL",()=>{
  const sql=readFileSync(resolve(process.cwd(),"scripts/arab-22-curriculum-readonly-audit.sql"),"utf8");
  const tail=sql.slice(sql.indexOf("-- 14. Grade-seven"));
  expect(tail).toContain("SOURCE_CHANGED_QUESTION_REVIEW_REQUIRED");
  expect(tail).toContain("MATCHED_ONLY_FOR_TEACHER_REVIEW_NOT_APPROVED_FOR_IMPORT");
  for(const l of p.lessons){expect(tail).toContain(l.existingLessonId);expect(tail).toContain(l.existingTitle);expect(tail).toContain(l.sourcePassageAnchor);}
  expect(tail.replace(/--[^\n]*/g,"")).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\s+(?:INTO|FROM|TABLE|ON)\b/i);
 });
});