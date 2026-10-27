import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
const data=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-drafts/bh-g1-s2-original-vocabulary-repairs.json"),"utf8")) as {
 countryCode:string;grade:number;semester:number;rights:{officialTocVerified:boolean;teacherReview:string;publicationApproved:boolean;automaticPublishAllowed:boolean};
 importSafety:{mode:string;mustMatchExistingLessonId:boolean;preventInsertLesson:boolean;preventDeleteOrOverwriteStudentProgress:boolean};
 lessons:Array<{
  existingLessonId:string;existingTitle:string;expectedStatus:string;expectedGrade:number;expectedSemester:number;
  targetLetters:string[];status:string;sourceAcademicYearVerified:boolean;publicationApproved:boolean;
  vocabulary:Array<{word:string;meaning:string;example:string;order:number}>;
  objectives:string[];learningExperience:{
   opening:string;guidedDiscovery:string;cooperativePractice:string;support:string;extension:string;
   originalDictationTeacherRead:string;independentPerformance:string;teacherRubric:Array<{criterion:string;max:number}>;
   assessment:{mode:string;automaticFreeTextGrade:boolean;progressMutation:boolean}
  };
 }>;
};
describe("Existing Bahrain grade-1 vocabulary repair stays linked and unpublished",()=>{
 it("authors 48 individual definitions and contextual sentences for 12 existing IDs, never duplicate lessons",()=>{
  expect(data.lessons).toHaveLength(12);
  expect(data.lessons.flatMap(x=>x.vocabulary)).toHaveLength(48);
  expect(new Set(data.lessons.map(x=>x.existingLessonId)).size).toBe(12);
  expect(new Set(data.lessons.map(x=>x.existingTitle)).size).toBe(12);
  for(const x of data.lessons){
   expect(x.existingLessonId).toMatch(/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i);
   expect(x.expectedStatus).toBe("published");
   expect(x.expectedGrade).toBe(1);expect(x.expectedSemester).toBe(2);
   expect(x.sourceAcademicYearVerified).toBe(false);
   expect(x.publicationApproved).toBe(false);
   expect(x.status).toMatch(/pending/);
   expect(x.vocabulary).toHaveLength(4);
   expect(x.objectives).toHaveLength(3);
   expect(new Set(x.vocabulary.map(w=>w.word)).size).toBe(4);
   expect(x.vocabulary.map(w=>w.order)).toEqual([1,2,3,4]);
   for(const w of x.vocabulary){
    expect(w.word.length).toBeGreaterThan(2);
    expect(w.meaning.length).toBeGreaterThan(12);
    expect(w.example.length).toBeGreaterThan(14);
    expect(w.example).toContain(w.word.replace(/[ًٌٍَُِّْ]/gu,"").slice(0,2).charAt(0));
   }
   for(const letter of x.targetLetters)expect(x.vocabulary.filter(w=>w.word.includes(letter)).length).toBeGreaterThanOrEqual(2);
   expect(x.learningExperience.opening.length).toBeGreaterThan(50);
   expect(x.learningExperience.guidedDiscovery.length).toBeGreaterThan(65);
   expect(x.learningExperience.support).not.toBe(x.learningExperience.extension);
   expect(x.learningExperience.teacherRubric.reduce((n,r)=>n+r.max,0)).toBe(6);
   expect(x.learningExperience.assessment).toEqual({mode:"teacher_observation_only",automaticFreeTextGrade:false,progressMutation:false});
  }
 });
 it("forbids textbook completion claims or one-click publishing",()=>{
  expect(data.countryCode).toBe("BH");
  expect(data.grade).toBe(1);expect(data.semester).toBe(2);
  expect(data.rights).toMatchObject({officialTocVerified:false,teacherReview:"pending",publicationApproved:false,automaticPublishAllowed:false});
  expect(data.importSafety.mode).toBe("review_only");
  expect(data.importSafety.mustMatchExistingLessonId).toBe(true);
  expect(data.importSafety.preventInsertLesson).toBe(true);
  expect(data.importSafety.preventDeleteOrOverwriteStudentProgress).toBe(true);
  expect(JSON.stringify(data)).not.toMatch(/student_id|user_id|correctAnswer|service_role/);
 });
});
