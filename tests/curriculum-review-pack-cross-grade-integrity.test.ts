import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
type Word={word:string;meaning:string;example:string};
type Question={id:string;question:string;explanation:string;options:Array<{id:string;text:string}>;correctAnswer:string};
type Lesson={existingLessonId:string;existingTitle:string;expectedGrade:number;expectedSemester:number;publicationApproved:boolean;officialTocVerified?:boolean;teacherReview:string;sourcePassageAnchor?:string;vocabulary:Word[];questions?:Question[]};
type Pack={countryCode:string;academicYear:string;grade:number;semester:number;rights:{publicationApproved:boolean;teacherReview:string;officialTocVerified?:boolean;sourceYearTextbookAlignment?:string};importSafety:{mode:string;noNewLessonRecords?:boolean;preventInsertLesson?:boolean;noProductionWrites?:boolean;requireTeacherSignoff?:boolean;requiresTeacherApproval?:boolean};lessons:Lesson[]};
const paths=[
 "data/curriculum-drafts/bh-g1-s2-original-vocabulary-repairs.json",
 "data/curriculum-drafts/bh-g2-s2-original-existing-reading-enhancements.json",
 "data/curriculum-drafts/bh-g3-s2-original-existing-reading-enhancements.json",
 "data/curriculum-drafts/bh-g4-s2-original-existing-reading-enhancements.json",
 "data/curriculum-drafts/bh-g5-s2-original-existing-reading-enhancements.json",
 "data/curriculum-drafts/bh-g6-s2-original-existing-reading-enhancements.json"
];
const packs=paths.map(path=>JSON.parse(readFileSync(resolve(process.cwd(),path),"utf8")) as Pack);
const all=packs.flatMap(p=>p.lessons);
describe("67 real lesson enhancement drafts stay independent, review-only and nonduplicating",()=>{
 it("holds six consecutive grades with 67 distinct existing IDs and no student progress mutations",()=>{
   expect(packs.map(p=>p.grade)).toEqual([1,2,3,4,5,6]);
   expect(packs.map(p=>p.lessons.length)).toEqual([12,12,12,11,10,10]);
   expect(all).toHaveLength(67);
   expect(new Set(all.map(l=>l.existingLessonId)).size).toBe(67);
   for(const p of packs){
     expect(p.countryCode).toBe("BH");expect(p.academicYear).toBe("2026-2027");expect(p.semester).toBe(2);
     expect(p.rights.publicationApproved).toBe(false);expect(p.rights.teacherReview).toBe("pending");
     expect(p.importSafety.mode).toBe("review_only");
     expect(p.importSafety.noNewLessonRecords===true||p.importSafety.preventInsertLesson===true).toBe(true);
     expect(p.importSafety.requireTeacherSignoff===true||p.importSafety.requiresTeacherApproval===true).toBe(true);
     if(p.grade>1){
       expect(p.importSafety.noProductionWrites).toBe(true);
       expect(p.rights.sourceYearTextbookAlignment).toBe("unverified");
     }else expect(p.rights.officialTocVerified).toBe(false);
     for(const l of p.lessons){
       expect(l.expectedGrade).toBe(p.grade);
       expect(l.expectedSemester).toBe(2);
       expect(l.publicationApproved).toBe(false);
       expect(l.teacherReview).toBe("pending");
       expect(l.existingLessonId).toMatch(/^[0-9a-f-]{36}$/i);
     }
   }
 });
 it("has 268 age-specific contextual words and 220 explanation-backed questions without duplicate MCQ IDs",()=>{
   const words=all.flatMap(l=>l.vocabulary);
   const questions=all.flatMap(l=>l.questions??[]);
   expect(words).toHaveLength(268);
   expect(questions).toHaveLength(220);
   expect(new Set(questions.map(q=>q.id)).size).toBe(220);
   for(const lesson of all){
     expect(lesson.vocabulary).toHaveLength(4);
     expect(new Set(lesson.vocabulary.map(w=>w.word)).size).toBe(4);
     for(const word of lesson.vocabulary){
       expect(word.meaning.trim().length).toBeGreaterThan(12);
       expect(word.example.trim().length).toBeGreaterThan(12);
     }
     for(const question of lesson.questions??[]){
       expect(question.explanation.length).toBeGreaterThan(14);
       expect(question.options).toHaveLength(3);
       expect(new Set(question.options.map(o=>o.id)).size).toBe(3);
       expect(question.options.some(o=>o.id===question.correctAnswer)).toBe(true);
     }
   }
 });
 it("requires source passage anchors on all Grade 3–6 lessons and refuses verified ministry status",()=>{
   const anchored=all.filter(l=>l.expectedGrade>=3);
   expect(anchored).toHaveLength(43);
   for(const l of anchored){
     expect(l.sourcePassageAnchor?.length).toBeGreaterThan(22);
     expect(l.officialTocVerified).toBe(false);
   }
   for(const p of packs){
     expect(p.rights.publicationApproved).toBe(false);
     if(p.grade>=2)expect(p.rights.sourceYearTextbookAlignment).not.toBe("verified");
   }
 });
});