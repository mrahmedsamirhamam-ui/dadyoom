import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
type Q={id:string;type:string;cognitiveLevel:string;question:string;options:Array<{id:string;text:string}>;correctAnswer:"a"|"b"|"c";explanation:string};
type L={existingLessonId:string;existingTitle:string;expectedLessonType:string;expectedGrade:number;expectedSemester:number;sourcePassageAnchor:string;objectives:string[];vocabulary:Array<{word:string;meaning:string;example:string;order:number}>;questions:Q[];publicationApproved:boolean;officialTocVerified:boolean;teacherReview:string;pedagogy:{opening:string;cooperative:string;differentiated:{support:string;core:string;extension:string};writtenPerformance:string;rubric:Array<{max:number}>;openWritingGrading:string}};
const p=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-drafts/bh-g8-s2-original-existing-reading-enhancements.json"),"utf8")) as {countryCode:string;grade:number;semester:number;academicYear:string;rights:{officialTextbookQuoted:boolean;sourceYearTextbookAlignment:string;publicationApproved:boolean;teacherReview:string};importSafety:{mode:string;linkExistingIdsOnly:boolean;matchSourcePassageBeforeImport:boolean;noNewLessonRecords:boolean;noProductionWrites:boolean;noLearnerProgressMutation:boolean;noAutomaticFreeTextGrading:boolean;requireTeacherSignoff:boolean};lessons:L[]};
describe("Grade-8 semester-two supplementary teaching and review material",()=>{
 it("authors 10 original linked reading supplements with 40 distinct questions and 40 explained vocabulary examples",()=>{
  expect(p.countryCode).toBe("BH");expect(p.grade).toBe(8);expect(p.semester).toBe(2);expect(p.academicYear).toBe("2026-2027");
  expect(p.lessons).toHaveLength(10);expect(new Set(p.lessons.map(l=>l.existingLessonId)).size).toBe(10);
  expect(p.lessons.flatMap(l=>l.vocabulary)).toHaveLength(40);
  expect(p.lessons.flatMap(l=>l.questions)).toHaveLength(40);
  const counts={a:0,b:0,c:0};
  for(const [i,l] of p.lessons.entries()){
   expect(l.existingLessonId).toMatch(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i);
   expect(l.expectedLessonType).toBe("reading");
   expect(l.expectedGrade).toBe(8);expect(l.expectedSemester).toBe(2);
   expect(l.sourcePassageAnchor.length).toBeGreaterThan(20);
   expect(l.objectives).toHaveLength(4);expect(l.publicationApproved).toBe(false);
   expect(l.officialTocVerified).toBe(false);expect(l.teacherReview).toBe("pending");
   expect(l.vocabulary.map(w=>w.order)).toEqual([1,2,3,4]);
   expect(new Set(l.vocabulary.map(w=>w.word)).size).toBe(4);
   for(const w of l.vocabulary){expect(w.meaning.length).toBeGreaterThan(18);expect(w.example.length).toBeGreaterThan(15);}
   expect(l.questions.map(q=>q.cognitiveLevel)).toEqual(["remember","understand","analyze","evaluate"]);
   for(const [j,q] of l.questions.entries()){
    expect(q.type).toBe("multiple_choice");expect(q.question.length).toBeGreaterThan(14);expect(q.explanation.length).toBeGreaterThan(19);
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.correctAnswer).toBe("abc"[(i*4+j)%3]);counts[q.correctAnswer]++;
   }
   expect(l.pedagogy.opening).toContain(l.existingTitle);
   expect(l.pedagogy.rubric.reduce((n,r)=>n+r.max,0)).toBe(9);
   expect(l.pedagogy.openWritingGrading).toBe("human_teacher_only");
  }
  expect(Math.max(...Object.values(counts))-Math.min(...Object.values(counts))).toBeLessThanOrEqual(1);
 });
 it("blocks importing, score writing and unverifiable official textbook statements",()=>{
  expect(p.rights).toMatchObject({officialTextbookQuoted:false,sourceYearTextbookAlignment:"unverified",publicationApproved:false,teacherReview:"pending"});
  expect(p.importSafety).toMatchObject({mode:"review_only",linkExistingIdsOnly:true,matchSourcePassageBeforeImport:true,noNewLessonRecords:true,noProductionWrites:true,noLearnerProgressMutation:true,noAutomaticFreeTextGrading:true,requireTeacherSignoff:true});
 });
 it("ensures read-only reconciliation of published IDs and source-passages",()=>{
  const sql=readFileSync(resolve(process.cwd(),"scripts/arab-22-curriculum-readonly-audit.sql"),"utf8");
  const tail=sql.slice(sql.indexOf("-- 15. Bahrain grade-eight"));
  expect(tail).toContain("SOURCE_CHANGED_REVIEW_QUESTIONS");
  expect(tail).toContain("MATCHED_FOR_TEACHER_REVIEW_NOT_IMPORT_APPROVED");
  for(const l of p.lessons){expect(tail).toContain(l.existingLessonId);expect(tail).toContain(l.existingTitle);expect(tail).toContain(l.sourcePassageAnchor);}
  const runnable=tail.replace(/--[^\n]*/g,"");
  expect(runnable).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\s+(?:INTO|FROM|TABLE|ON)\b/i);
 });
});