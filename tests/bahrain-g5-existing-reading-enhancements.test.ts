import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
type Question={id:string;type:string;cognitiveLevel:string;question:string;correctAnswer:"a"|"b"|"c";options:Array<{id:string;text:string}>;explanation:string};
type Lesson={existingLessonId:string;existingTitle:string;expectedLessonType:string;expectedGrade:number;expectedSemester:number;sourcePassageAnchor:string;objectives:string[];vocabulary:Array<{word:string;meaning:string;example:string;order:number}>;questions:Question[];publicationApproved:boolean;officialTocVerified:boolean;teacherReview:string;pedagogy:{opening:string;cooperative:string;differentiated:{support:string;core:string;extension:string};writtenPerformance:string;rubric:Array<{max:number}>;openWritingGrading:string}};
const p=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-drafts/bh-g5-s2-original-existing-reading-enhancements.json"),"utf8")) as {countryCode:string;grade:number;semester:number;rights:{sourceYearTextbookAlignment:string;officialTextbookQuoted:boolean;publicationApproved:boolean;teacherReview:string};importSafety:{mode:string;linkExistingIdsOnly:boolean;matchSourcePassageBeforeImport:boolean;noNewLessonRecords:boolean;noProductionWrites:boolean;noLearnerProgressMutation:boolean;noAutomaticFreeTextGrading:boolean;requireTeacherSignoff:boolean};lessons:Lesson[]};
describe("Grade-5 second-term existing-reading enrichment stays unpublished",()=>{
 it("contains 10 distinct IDs, 40 new contextual words, 40 distinct MCQs and teacher-only writing rubrics",()=>{
  expect(p.countryCode).toBe("BH");expect(p.grade).toBe(5);expect(p.semester).toBe(2);
  expect(p.lessons).toHaveLength(10);
  expect(p.lessons.flatMap(l=>l.vocabulary)).toHaveLength(40);
  expect(p.lessons.flatMap(l=>l.questions)).toHaveLength(40);
  expect(new Set(p.lessons.map(l=>l.existingLessonId)).size).toBe(10);
  expect(new Set(p.lessons.map(l=>l.existingTitle)).size).toBe(10);
  const keys={a:0,b:0,c:0};
  for(const [i,l] of p.lessons.entries()){
   expect(l.existingLessonId).toMatch(/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i);
   expect(l.expectedLessonType).toBe("reading");
   expect(l.expectedGrade).toBe(5);expect(l.expectedSemester).toBe(2);
   expect(l.sourcePassageAnchor.length).toBeGreaterThan(22);
   expect(l.teacherReview).toBe("pending");expect(l.officialTocVerified).toBe(false);expect(l.publicationApproved).toBe(false);
   expect(l.objectives).toHaveLength(4);
   expect(l.vocabulary.map(v=>v.order)).toEqual([1,2,3,4]);
   expect(new Set(l.vocabulary.map(v=>v.word)).size).toBe(4);
   for(const w of l.vocabulary){expect(w.meaning.length).toBeGreaterThan(17);expect(w.example.length).toBeGreaterThan(17);}
   expect(l.questions.map(q=>q.cognitiveLevel)).toEqual(["remember","understand","analyze","apply"]);
   for(const [j,q] of l.questions.entries()){
     expect(q.type).toBe("multiple_choice");
     expect(q.question.length).toBeGreaterThan(13);expect(q.explanation.length).toBeGreaterThan(18);
     expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
     expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
     expect(q.correctAnswer).toBe("abc"[(i*4+j)%3]);
     keys[q.correctAnswer]++;
   }
   expect(l.pedagogy.opening).toContain(l.existingTitle);
   expect(l.pedagogy.rubric.reduce((s,r)=>s+r.max,0)).toBe(9);
   expect(l.pedagogy.openWritingGrading).toBe("human_teacher_only");
  }
  expect(Math.max(...Object.values(keys))-Math.min(...Object.values(keys))).toBeLessThanOrEqual(1);
 });
 it("prevents automatic production/student-grades writes or official textbook claims",()=>{
  expect(p.rights).toMatchObject({officialTextbookQuoted:false,sourceYearTextbookAlignment:"unverified",publicationApproved:false,teacherReview:"pending"});
  expect(p.importSafety).toMatchObject({mode:"review_only",linkExistingIdsOnly:true,matchSourcePassageBeforeImport:true,noNewLessonRecords:true,noProductionWrites:true,noLearnerProgressMutation:true,noAutomaticFreeTextGrading:true,requireTeacherSignoff:true});
 });
 it("enforces read-only live UUID/title/year/term/source-text match before any review import",()=>{
  const sql=readFileSync(resolve(process.cwd(),"scripts/arab-22-curriculum-readonly-audit.sql"),"utf8");
  const part=sql.slice(sql.indexOf("-- 12. Bahrain grade-5 reading"));
  expect(part).toContain("SOURCE_CHANGED_REVIEW_QUESTIONS");
  expect(part).toContain("MATCHED_TEACHER_REVIEW_NOT_PUBLISH_READY");
  for(const l of p.lessons){expect(part).toContain(l.existingLessonId);expect(part).toContain(l.existingTitle);expect(part).toContain(l.sourcePassageAnchor);}
  const executable=part.replace(/--[^\n]*/g,"");
  expect(executable).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\s+(?:INTO|FROM|TABLE|ON)\b/i);
 });
});