import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
const audit=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-audits/arab-22-grades-1-3-baseline-2026-10-27.json"),"utf8")) as {
 schemaVersion:number;schoolYear:string;
 claimSafety:{allTitlesMatchedAgainstOfficialTextbookTOCs:boolean;noVerifiedCompleteCountryGrade:boolean;publishedDoesNotMeanMinistryAligned:boolean;genericLessonDoesNotProveRequiredTitle:boolean;questionCountDoesNotProvePedagogicalQuality:boolean;noProductionChanges:boolean;neverAutopublishOnSnapshot:boolean};
 officialSourceEvidence:Array<{countryCode:string;url:string;scope:string;editionStatus:string;textbookLessonTOCCompared:boolean;licenseForReproducingTextVerified:boolean}>;
 countryGradeAudit:Array<{countryCode:string;grade:number;total_lessons:number;published_lessons:number;nonpublished_lessons:number;published_no_term:number;published_no_stored_vocabulary:number;published_generic_dadyoom_skill_packs:number;published_fewer_than_3_assessment_records:number;total_question_rows:number;total_activity_rows:number;currentOfficialTextbookEditionVerified:boolean;titleByTitleComparedAgainstOfficialSource:boolean;curriculumStatus:string}>;
 questionQualityBaseline:Array<{grade:number;totalQuestionRows:number;distinctPromptTexts:number;shortPromptsUnder18Chars:number;noStoredAnswerKeys:number;fewerThanTwoOptions:number;genericPackQuestionRows:number}>;
};
describe("22 countries / grades 1-3: evidence-only official alignment audit",()=>{
 it("enumerates 66 grade-country pairs without duplicates, false green or unsafe edits",()=>{
  expect(audit.schemaVersion).toBe(1);expect(audit.schoolYear).toBe("2026-2027");
  expect(audit.countryGradeAudit).toHaveLength(66);
  const codes=new Set(audit.countryGradeAudit.map(x=>x.countryCode));expect(codes.size).toBe(22);
  for(const grade of [1,2,3])expect(audit.countryGradeAudit.filter(x=>x.grade===grade)).toHaveLength(22);
  expect(new Set(audit.countryGradeAudit.map(x=>x.countryCode+":"+x.grade)).size).toBe(66);
  for(const p of audit.countryGradeAudit){
   expect(p.currentOfficialTextbookEditionVerified).toBe(false);
   expect(p.titleByTitleComparedAgainstOfficialSource).toBe(false);
   expect(p.curriculumStatus).toBe("requires-official-grade-term-textbook-TOC-reconciliation");
   expect(p.total_lessons).toBe(p.published_lessons+p.nonpublished_lessons);
   expect(p.published_generic_dadyoom_skill_packs).toBeLessThanOrEqual(p.published_lessons);
   expect(p.published_no_term).toBeLessThanOrEqual(p.published_lessons);
   expect(p.published_no_stored_vocabulary).toBeLessThanOrEqual(p.published_lessons);
   expect(p.published_fewer_than_3_assessment_records).toBeLessThanOrEqual(p.published_lessons);
   expect(p.total_question_rows).toBeGreaterThanOrEqual(0);
  }
  expect(audit.claimSafety).toEqual({
   allTitlesMatchedAgainstOfficialTextbookTOCs:false,
   noVerifiedCompleteCountryGrade:true,
   publishedDoesNotMeanMinistryAligned:true,
   genericLessonDoesNotProveRequiredTitle:true,
   questionCountDoesNotProvePedagogicalQuality:true,
   noProductionChanges:true,
   neverAutopublishOnSnapshot:true
  });
 });
 it("retains official primary sources with clear evidence limits, not a ministry-book license",()=>{
  expect(audit.officialSourceEvidence.length).toBeGreaterThanOrEqual(6);
  for(const e of audit.officialSourceEvidence){
   expect(e.url).toMatch(/^https:\/\//);
   expect(new URL(e.url).hostname).not.toBe("");
   expect(e.scope.length).toBeGreaterThan(20);
   expect(e.editionStatus.length).toBeGreaterThan(12);
   expect(e.textbookLessonTOCCompared).toBe(false);
   expect(e.licenseForReproducingTextVerified).toBe(false);
  }
 });
 it("identifies generic activity inflation and measures prompt diversity without reading any answer keys",()=>{
  expect(audit.countryGradeAudit.reduce((n,p)=>n+p.published_generic_dadyoom_skill_packs,0)).toBe(1188);
  expect(audit.questionQualityBaseline.map(q=>q.grade)).toEqual([1,2,3]);
  for(const q of audit.questionQualityBaseline){
   expect(q.totalQuestionRows).toBeGreaterThan(q.distinctPromptTexts);
   expect(q.genericPackQuestionRows).toBe(1980);
   expect(q.shortPromptsUnder18Chars).toBeGreaterThan(0);
   expect(q.noStoredAnswerKeys).toBe(0);
   expect(q.fewerThanTwoOptions).toBe(0);
  }
 });
 it("ensures production audit SQL has no DML/DDL and inventories all grades",()=>{
  const sql=readFileSync(resolve(process.cwd(),"scripts/arab-22-grades-1-3-readonly-audit.sql"),"utf8");
  const executable=sql.replace(/--[^\n]*/g,"");
  expect(executable).toContain("g.grade_number IN (1,2,3)");
  expect(executable).toContain("COUNT(lesson_id)");
  expect(executable).toContain("published_generic_dadyoom_skill_packs");
  expect(executable).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|CREATE)\s+(?:INTO|FROM|TABLE|ON|VIEW|INDEX)\b/i);
 });
});