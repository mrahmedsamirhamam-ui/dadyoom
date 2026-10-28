import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe,expect,it } from "vitest";

type Question={id:string;type:string;cognitiveLevel:string;question:string;correctAnswer:"a"|"b"|"c";options:Array<{id:string;text:string}>;explanation:string};
type Lesson={existingLessonId:string;existingTitle:string;expectedLessonType:string;expectedGrade:number;expectedSemester:number;sourcePassageAnchor:string;objectives:string[];vocabulary:Array<{word:string;meaning:string;example:string;order:number}>;questions:Question[];publicationApproved:boolean;officialTocVerified:boolean;teacherReview:string;pedagogy:{opening:string;cooperative:string;differentiated:{support:string;core:string;extension:string};writtenPerformance:string;rubric:Array<{max:number}>;openWritingGrading:string}};
const p=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-drafts/bh-g4-s2-original-existing-reading-enhancements.json"),"utf8")) as {
 countryCode:string;grade:number;semester:number;rights:{sourceYearTextbookAlignment:string;officialTextbookQuoted:boolean;publicationApproved:boolean;teacherReview:string};
 importSafety:{mode:string;linkExistingIdsOnly:boolean;matchSourcePassageBeforeImport:boolean;noNewLessonRecords:boolean;noProductionWrites:boolean;noLearnerProgressMutation:boolean;noAutomaticFreeTextGrading:boolean;requireTeacherSignoff:boolean};
 lessons:Lesson[];
};
describe("Grade-4 new enrichment for already-existing Dadyoom lessons remains unpublished",()=>{
 it("contains 11 unique real UUIDs, 44 original vocabulary samples and 44 graded draft questions",()=>{
  expect(p.countryCode).toBe("BH");expect(p.grade).toBe(4);expect(p.semester).toBe(2);
  expect(p.lessons).toHaveLength(11);
  expect(p.lessons.flatMap(l=>l.vocabulary)).toHaveLength(44);
  expect(p.lessons.flatMap(l=>l.questions)).toHaveLength(44);
  expect(new Set(p.lessons.map(l=>l.existingLessonId)).size).toBe(11);
  expect(new Set(p.lessons.map(l=>l.existingTitle)).size).toBe(11);
  const distribution={a:0,b:0,c:0};
  for(const [i,l] of p.lessons.entries()){
   expect(l.existingLessonId).toMatch(/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i);
   expect(l.sourcePassageAnchor.length).toBeGreaterThan(24);
   expect(l.expectedLessonType).toBe("reading");
   expect(l.expectedGrade).toBe(4);expect(l.expectedSemester).toBe(2);
   expect(l.publicationApproved).toBe(false);expect(l.officialTocVerified).toBe(false);
   expect(l.teacherReview).toBe("pending");
   expect(l.objectives).toHaveLength(4);
   expect(l.vocabulary.map(w=>w.order)).toEqual([1,2,3,4]);
   expect(new Set(l.vocabulary.map(w=>w.word)).size).toBe(4);
   for(const w of l.vocabulary){
    expect(w.meaning.length).toBeGreaterThan(17);
    expect(w.example.length).toBeGreaterThan(15);
   }
   expect(l.questions.map(q=>q.cognitiveLevel)).toEqual(["remember","understand","analyze","apply"]);
   for(const [j,q] of l.questions.entries()){
    expect(q.type).toBe("multiple_choice");
    expect(q.question.length).toBeGreaterThan(13);
    expect(q.explanation.length).toBeGreaterThan(18);
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.correctAnswer).toBe("abc"[(i*4+j)%3]);
    distribution[q.correctAnswer]++;
   }
   expect(l.pedagogy.opening).toContain(l.existingTitle);
   expect(l.pedagogy.rubric.reduce((sum,r)=>sum+r.max,0)).toBe(9);
   expect(l.pedagogy.openWritingGrading).toBe("human_teacher_only");
  }
  const counts=Object.values(distribution);expect(Math.max(...counts)-Math.min(...counts)).toBeLessThanOrEqual(1);
 });
 it("enforces live UUID/title/term/source-phrase reconciliation with read-only SQL",()=>{
  const sql=readFileSync(resolve(process.cwd(),"scripts/arab-22-curriculum-readonly-audit.sql"),"utf8");
  const tail=sql.slice(sql.indexOf("-- 11. Bahrain grade-4"));
  expect(tail).toContain("SOURCE_TEXT_CHANGED_REVIEW_ASSESSMENTS");
  expect(tail).toContain("MATCHED_FOR_TEACHER_REVIEW_NOT_IMPORT_APPROVED");
  for(const l of p.lessons){
   expect(tail).toContain(l.existingLessonId);
   expect(tail).toContain(l.existingTitle);
   expect(tail).toContain(l.sourcePassageAnchor);
  }
  const executable=tail.replace(/--[^\n]*/g,"");
  expect(executable).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\s+(?:INTO|FROM|TABLE|ON)\b/i);
 });
 it("requires human source audit and forbids production or automatic score writes",()=>{
  expect(p.rights).toMatchObject({sourceYearTextbookAlignment:"unverified",officialTextbookQuoted:false,publicationApproved:false,teacherReview:"pending"});
  expect(p.importSafety).toMatchObject({mode:"review_only",linkExistingIdsOnly:true,matchSourcePassageBeforeImport:true,noNewLessonRecords:true,noProductionWrites:true,noLearnerProgressMutation:true,noAutomaticFreeTextGrading:true,requireTeacherSignoff:true});
 });
});
