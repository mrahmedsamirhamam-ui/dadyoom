import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
type Q={order:number;question:string;questionType:string;correctAnswer:string;options:Array<{id:string;text:string}>;explanation:string};
type L={lessonId:string;title:string;sourceAnchor:string;questions:Q[]};
const p=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-drafts/ps-g2-seven-existing-reading-specific-question-fixes.json"),"utf8")) as {grade:number;ministry2026BookTOCVerified:boolean;safety:{requireNoExistingStudentAttempts:boolean;replaceOnlyThreeIdentifiedGenericQuestions:boolean;preserveQuestionIds:boolean;doNotChangeStudentScores:boolean;requireSourceAnchor:boolean};lessons:L[]};
describe("Seven existing PS Grade-2 texts replace generic formative questions without grade writes",()=>{
 it("has 21 anchored text-specific answerable questions and 7 unique lesson IDs",()=>{
  expect(p.grade).toBe(2);expect(p.lessons).toHaveLength(7);
  expect(new Set(p.lessons.map(x=>x.lessonId)).size).toBe(7);
  for(const l of p.lessons){
   expect(l.lessonId).toMatch(/^[0-9a-f-]{36}$/i);
   expect(l.sourceAnchor.length).toBeGreaterThan(22);
   expect(l.questions.map(q=>q.order)).toEqual([1,2,3]);
   for(const q of l.questions){
    expect(q.question.length).toBeGreaterThan(13);
    expect(q.explanation.length).toBeGreaterThan(15);
    expect(q.options).toHaveLength(3);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.options.some(o=>o.id===q.correctAnswer)).toBe(true);
    expect(q.question).not.toMatch(/ما أفضل بداية لدراسة|كيف تستخدم ضاد بطريقة|ما الدليل الأقوى/);
   }
  }
 });
 it("only permits a no-student-history guarded old generic question cutover",()=>{
  expect(p.ministry2026BookTOCVerified).toBe(false);
  expect(p.safety).toMatchObject({requireNoExistingStudentAttempts:true,replaceOnlyThreeIdentifiedGenericQuestions:true,preserveQuestionIds:true,doNotChangeStudentScores:true,requireSourceAnchor:true});
 });
});