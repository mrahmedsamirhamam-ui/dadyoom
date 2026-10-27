import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
type Question={question:string;correct:string;wrong:string[];explanation:string};
type Lesson={countryCode:string;grade:number;semester:number;unitId:string;title:string;content:string;questions:Question[];vocabulary:unknown[];objectives:unknown[];sourceTopicEvidence:{portalUrl:string;verifiedTopicOnMinistryLearningPortal:boolean;currentEditionTOCVerified:boolean}};
type OriginalPack={officialCopyright:boolean;schoolYearTextbookEditionVerified:boolean;lessons:Lesson[];writeSafety:{notMigrateStudentGrades:boolean}};
const pack=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-drafts/ps-grades-1-3-verified-portal-original-support-2026.json"),"utf8")) as OriginalPack;
describe("Original Palestinian grade 1-3 lessons with source-backed topic names",()=>{
 it("authors independent reading and three distinct MCQs for 10 previously absent titles",()=>{
  expect(pack.lessons).toHaveLength(10);
  expect(pack.lessons.map(l=>l.grade)).toEqual([1,1,1,1,1,2,3,3,3,3]);
  expect(new Set(pack.lessons.map(l=>l.grade+":"+l.semester+":"+l.title)).size).toBe(10);
  for(const lesson of pack.lessons){
   expect(lesson.countryCode).toBe("PS");expect(lesson.sourceTopicEvidence.portalUrl).toMatch(/^https:\/\/elearn\.edu\.ps\//);
   expect(lesson.sourceTopicEvidence.verifiedTopicOnMinistryLearningPortal).toBe(true);
   expect(lesson.sourceTopicEvidence.currentEditionTOCVerified).toBe(false);
   expect(lesson.content).toContain("من تأليف ضاديوم");
   expect(lesson.content).toContain("لا ينقلان مادة الكتاب");
   expect(lesson.questions.length).toBeGreaterThanOrEqual(3);
   expect(lesson.vocabulary.length).toBeGreaterThanOrEqual(3);
   expect(lesson.objectives).toHaveLength(3);
   expect(lesson.unitId).toMatch(/^[0-9a-f-]{36}$/);
   for(const q of lesson.questions){
    expect(q.question.length).toBeGreaterThan(15);
    expect(q.explanation.length).toBeGreaterThan(17);
    expect(new Set([q.correct,...q.wrong]).size).toBe(3);
   }
  }
 });
 it("does not claim ownership or completion of the Palestinian ministry textbook",()=>{
  expect(pack.officialCopyright).toBe(false);
  expect(pack.schoolYearTextbookEditionVerified).toBe(false);
  expect(pack.writeSafety.notMigrateStudentGrades).toBe(true);
 });
});