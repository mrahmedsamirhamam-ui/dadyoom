import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
type Q={id:string;type:string;cognitiveLevel:string;question:string;options:Array<{id:string;text:string}>;correctAnswer:"a"|"b"|"c";explanation:string};
type L={existingLessonId:string;existingTitle:string;expectedLessonType:string;expectedGrade:number;expectedSemester:number;sourcePassageAnchor:string;objectives:string[];vocabulary:Array<{word:string;meaning:string;example:string;order:number}>;questions:Q[];publicationApproved:boolean;officialTocVerified:boolean;teacherReview:string;pedagogy:{opening:string;cooperative:string;differentiated:{support:string;core:string;extension:string};writingPerformance:string;rubric:Array<{max:number}>;openWritingGrading:string}};
const p=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-drafts/bh-g6-s2-original-existing-reading-enhancements.json"),"utf8")) as {countryCode:string;grade:number;semester:number;rights:{officialTextbookQuoted:boolean;sourceYearTextbookAlignment:string;publicationApproved:boolean;teacherReview:string};importSafety:{mode:string;linkExistingIdsOnly:boolean;matchSourcePassageBeforeImport:boolean;noNewLessonRecords:boolean;noProductionWrites:boolean;noLearnerProgressMutation:boolean;noAutomaticFreeTextGrading:boolean;requireTeacherSignoff:boolean};lessons:L[]};
describe("Bahrain Grade-6 existing-reading drafts: 40 vocabulary + 40 source-grounded tests",()=>{
 it("includes ten unique original lesson UUIDs, Bloom progression and human-reviewed performance tasks",()=>{
  expect(p.countryCode).toBe("BH");expect(p.grade).toBe(6);expect(p.semester).toBe(2);
  expect(p.lessons).toHaveLength(10);
  expect(p.lessons.flatMap(l=>l.vocabulary)).toHaveLength(40);
  expect(p.lessons.flatMap(l=>l.questions)).toHaveLength(40);
  expect(new Set(p.lessons.map(l=>l.existingLessonId)).size).toBe(10);
  const keys={a:0,b:0,c:0};
  for(const [i,l] of p.lessons.entries()){
   expect(l.existingLessonId).toMatch(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i);
   expect(l.expectedGrade).toBe(6);expect(l.expectedSemester).toBe(2);
   expect(l.expectedLessonType).toBe("reading");
   expect(l.sourcePassageAnchor.length).toBeGreaterThan(23);
   expect(l.publicationApproved).toBe(false);expect(l.officialTocVerified).toBe(false);expect(l.teacherReview).toBe("pending");
   expect(l.objectives).toHaveLength(4);expect(l.vocabulary).toHaveLength(4);
   expect(l.vocabulary.map(w=>w.order)).toEqual([1,2,3,4]);
   expect(new Set(l.vocabulary.map(w=>w.word)).size).toBe(4);
   for(const w of l.vocabulary){
    expect(w.meaning.length).toBeGreaterThan(16);expect(w.example.length).toBeGreaterThan(15);
   }
   expect(l.questions.map(q=>q.cognitiveLevel)).toEqual(["remember","understand","analyze","evaluate"]);
   for(const [j,q] of l.questions.entries()){
    expect(q.type).toBe("multiple_choice");
    expect(q.question.length).toBeGreaterThan(14);expect(q.explanation.length).toBeGreaterThan(17);
    expect(q.options.map(x=>x.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(x=>x.text)).size).toBe(3);
    expect(q.correctAnswer).toBe("abc"[(i*4+j)%3]);keys[q.correctAnswer]++;
   }
   expect(l.pedagogy.opening).toContain(l.existingTitle);
   expect(l.pedagogy.rubric.reduce((s,r)=>s+r.max,0)).toBe(9);
   expect(l.pedagogy.openWritingGrading).toBe("human_teacher_only");
  }
  expect(Math.max(...Object.values(keys))-Math.min(...Object.values(keys))).toBeLessThanOrEqual(1);
 });
 it("blocks official textbook claims, import and automatic grade writes",()=>{
  expect(p.rights).toMatchObject({officialTextbookQuoted:false,sourceYearTextbookAlignment:"unverified",publicationApproved:false,teacherReview:"pending"});
  expect(p.importSafety).toMatchObject({mode:"review_only",linkExistingIdsOnly:true,matchSourcePassageBeforeImport:true,noNewLessonRecords:true,noProductionWrites:true,noLearnerProgressMutation:true,noAutomaticFreeTextGrading:true,requireTeacherSignoff:true});
 });
 it("matches canonical IDs/title/term/text via read-only SQL without student data",()=>{
  const sql=readFileSync(resolve(process.cwd(),"scripts/arab-22-curriculum-readonly-audit.sql"),"utf8");
  const part=sql.slice(sql.indexOf("-- 13. Grade-six"));
  expect(part).toContain("SOURCE_TEXT_CHANGED_REVIEW_QUESTIONS");
  expect(part).toContain("MATCHED_FOR_TEACHER_REVIEW_NOT_IMPORT_APPROVED");
  for(const l of p.lessons){expect(part).toContain(l.existingLessonId);expect(part).toContain(l.existingTitle);expect(part).toContain(l.sourcePassageAnchor);}
  const code=part.replace(/--[^\n]*/g,"");
  expect(code).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\s+(?:INTO|FROM|TABLE|ON)\b/i);
 });
});