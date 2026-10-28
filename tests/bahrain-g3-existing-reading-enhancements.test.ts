import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe,expect,it } from "vitest";

type Question={id:string;type:string;cognitiveLevel:string;question:string;correctAnswer:"a"|"b"|"c";options:Array<{id:string;text:string}>;explanation:string};
type Lesson={existingLessonId:string;existingTitle:string;sourcePassageAnchor:string;expectedLessonType:string;expectedGrade:number;expectedSemester:number;objectives:string[];vocabulary:Array<{word:string;meaning:string;example:string;order:number}>;questions:Question[];publicationApproved:boolean;officialTocVerified:boolean;teacherReview:string;pedagogy:{opening:string;guidedDiscovery:string;cooperative:string;differentiated:{support:string;core:string;extension:string};writingPerformance:string;teacherRubric:Array<{max:number}>;openWritingGrading:string}};
const pack=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-drafts/bh-g3-s2-original-existing-reading-enhancements.json"),"utf8")) as {countryCode:string;grade:number;semester:number;rights:{sourceYearTextbookAlignment:string;officialTextbookQuoted:boolean;publicationApproved:boolean;teacherReview:string};importSafety:{mode:string;linkExistingIdsOnly:boolean;noNewLessonRecords:boolean;noProductionWrites:boolean;noLearnerProgressMutation:boolean;noAutomaticFreeTextGrading:boolean;requireTeacherSignoff:boolean};lessons:Lesson[]};

describe("12 Grade-3 source-grounded reading enhancements remain teacher-review only",()=>{
 it("authors 48 contextualized original word meanings and 48 explainable questions on 12 unique existing lessons",()=>{
   expect(pack.countryCode).toBe("BH");expect(pack.grade).toBe(3);expect(pack.semester).toBe(2);
   expect(pack.lessons).toHaveLength(12);
   expect(new Set(pack.lessons.map(l=>l.existingLessonId)).size).toBe(12);
   expect(new Set(pack.lessons.map(l=>l.existingTitle)).size).toBe(12);
   expect(pack.lessons.flatMap(l=>l.vocabulary)).toHaveLength(48);
   expect(pack.lessons.flatMap(l=>l.questions)).toHaveLength(48);
   const keys={a:0,b:0,c:0};
   for(const [i,l] of pack.lessons.entries()){
     expect(l.existingLessonId).toMatch(/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i);
     expect(l.expectedLessonType).toBe("reading");
     expect(l.expectedGrade).toBe(3);expect(l.expectedSemester).toBe(2);
     expect(l.objectives).toHaveLength(4);
     expect(l.vocabulary.map(w=>w.order)).toEqual([1,2,3,4]);
     expect(new Set(l.vocabulary.map(w=>w.word)).size).toBe(4);
     expect(l.publicationApproved).toBe(false);
     expect(l.officialTocVerified).toBe(false);
     expect(l.teacherReview).toBe("pending");
     expect(l.pedagogy.opening).toContain(l.existingTitle);
     expect(l.pedagogy.guidedDiscovery.length).toBeGreaterThan(100);
     expect(l.pedagogy.differentiated.support).not.toBe(l.pedagogy.differentiated.extension);
     expect(l.pedagogy.teacherRubric.reduce((sum,x)=>sum+x.max,0)).toBe(9);
     expect(l.pedagogy.openWritingGrading).toBe("human_teacher_only");
     for(const w of l.vocabulary) {
       expect(w.meaning.length).toBeGreaterThan(17);
       expect(w.example.length).toBeGreaterThan(17);
     }
     expect(l.questions.map(q=>q.cognitiveLevel)).toEqual(["remember","understand","analyze","apply"]);
     for(const [j,q] of l.questions.entries()){
       expect(q.question.length).toBeGreaterThan(16);
       expect(q.explanation.length).toBeGreaterThan(19);
       expect(q.type).toBe("multiple_choice");
       expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
       expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
       expect(q.correctAnswer).toBe("abc"[(i*4+j)%3]);
       keys[q.correctAnswer]++;
     }
   }
   expect(keys).toEqual({a:16,b:16,c:16});
 });
 it("reconciles 12 proposed enhancements against existing rows using SELECT only",()=>{
   const sql=readFileSync(resolve(process.cwd(),"scripts/arab-22-curriculum-readonly-audit.sql"),"utf8");
   const s=sql.slice(sql.indexOf("-- 10. Existing Grade-3"));
   expect(s).toContain("MATCHED_FOR_TEACHER_REVIEW_NOT_FOR_AUTO_IMPORT");
   expect(s).toContain("VOCABULARY_ALREADY_EXISTS");
   expect(s).toContain("CLASSIFICATION_CHANGED");
   for(const l of pack.lessons){
     expect(l.sourcePassageAnchor.length).toBeGreaterThan(20);
     expect(s).toContain(l.existingLessonId);
     expect(s).toContain(l.existingTitle);
     expect(s).toContain(l.sourcePassageAnchor);
   }
   expect(s).toContain("SOURCE_PASSAGE_CHANGED_REVIEW_QUESTIONS");
   const executable=s.replace(/--[^\n]*/g,"");
   expect(executable).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\s+(?:INTO|FROM|TABLE|ON)\b/i);
 });
 it("never treats original supplementary paragraphs as certified ministry material",()=>{
   expect(pack.rights).toEqual({authoredBy:"Dadyoom",sourceYearTextbookAlignment:"unverified",officialTextbookQuoted:false,publicationApproved:false,teacherReview:"pending"});
   expect(pack.importSafety).toMatchObject({mode:"review_only",linkExistingIdsOnly:true,noNewLessonRecords:true,noProductionWrites:true,noLearnerProgressMutation:true,noAutomaticFreeTextGrading:true,requireTeacherSignoff:true});
 });
});