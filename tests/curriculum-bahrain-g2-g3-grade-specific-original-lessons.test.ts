import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Question = {order:number; question:string; options:{id:string;text:string}[]; correctAnswer:string; explanation:string};
type Activity = {order:number; activityType:string; options?:string[]; correctAnswer?:string; instructions:string; modelAnswer?:string};
type Lesson = {id:string;grade:number;title:string;content:string;summary:string;learningObjectives:string[];vocabulary:{word:string;meaning:string}[]; questions:Question[];activities:Activity[]};
const pack=JSON.parse(readFileSync(resolve(process.cwd(),
 "data/curriculum-drafts/bh-g2-g3-two-grade-specific-reading-grammar-original-replacements-2026.json"),"utf8"))
 as {lessons:Lesson[];requiredNoRecordedAttempts:boolean;requiredNoProgress:boolean;preserveExistingLessonAndQuestionIds:boolean;preserveSourceInstructions:boolean};

describe("Original Bahrain Grade-2/3 grade-specific reading and grammar lessons",()=>{
 it("upgrades the four existing records, not invented official textbook lessons",()=>{
  expect(pack.lessons).toHaveLength(4);
  expect(new Set(pack.lessons.map(l=>l.id)).size).toBe(4);
  for(const grade of [2,3]){
   expect(pack.lessons.filter(l=>l.grade===grade).map(l=>l.title).sort())
    .toEqual(["الجملة الاسمية البسيطة","قراءة نص قصير"].sort());
  }
  expect(pack.requiredNoRecordedAttempts).toBe(true);
  expect(pack.requiredNoProgress).toBe(true);
  expect(pack.preserveExistingLessonAndQuestionIds).toBe(true);
  expect(pack.preserveSourceInstructions).toBe(true);
 });
 it("provides genuinely different grade-specific text, measurable objectives and vocabulary",()=>{
  for(const title of ["الجملة الاسمية البسيطة","قراءة نص قصير"]){
   const texts=pack.lessons.filter(l=>l.title===title).map(l=>l.content);
   expect(new Set(texts).size).toBe(2);
   expect(texts.every(s=>s.length>450)).toBe(true);
   expect(texts.every(s=>s.includes("ليس نص")||s.includes("ليس نصًا"))).toBe(true);
  }
  for(const l of pack.lessons){
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(o=>o.startsWith("أن ")&&o.length>26)).toBe(true);
   expect(l.vocabulary).toHaveLength(3);
   expect(l.vocabulary.every(x=>x.word.length>1&&x.meaning.length>7)).toBe(true);
   expect(l.content).toContain("نشاط متمايز:");
   expect(l.content).toContain("الدعم:");
   expect(l.content).toContain("التحدي:");
   expect(l.content).not.toMatch(/\nمفتاح الإجابة:|\nالإجابة النموذجية:/u);
  }
 });
 it("contains 20 specific questions, 8 linked MCQ activities and four open activities",()=>{
  let questionCount=0,activityCount=0;
  for(const l of pack.lessons){
   expect(l.questions.map(q=>q.order)).toEqual([1,2,3,4,5]);
   expect(l.activities.map(a=>a.order)).toEqual([1,2,3]);
   for(const q of l.questions){
    questionCount++;
    expect(q.question.length).toBeGreaterThan(18);
    expect(q.explanation.length).toBeGreaterThan(18);
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.options.some(o=>o.id===q.correctAnswer)).toBe(true);
    expect(q.question).not.toMatch(/المهارة الرئيسة التي يتدرب|عنوان الدرس|ما الخطوة الأفضل بعد فهم مثال/u);
   }
   for(const a of l.activities){
    activityCount++;
    expect(a.instructions.length).toBeGreaterThan(25);
    if(a.order<=2){
     expect(a.activityType).toBe("multiple_choice");
     expect(a.options).toHaveLength(3);
     expect(a.options).toContain(a.correctAnswer);
     expect(l.questions.some(q=>q.question===a.instructions)).toBe(true);
    }else{
     expect(["reading","writing"]).toContain(a.activityType);
     expect((a.modelAnswer||"").length).toBeGreaterThan(35);
    }
   }
  }
  expect(questionCount).toBe(20);
  expect(activityCount).toBe(12);
 });
});
