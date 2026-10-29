import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
const path="data/curriculum-drafts/bahrain-grades123-original-listening-instructions-20261029.json";
const raw=readFileSync(resolve(process.cwd(),path),"utf8");
const pack=JSON.parse(raw) as {
 skill:string;country:string;grades:number[];containsAnswerKeys:boolean;audioAssetPresent:boolean;
 officialMinistryAlignmentVerified:boolean;teacherInstruction:string;
 lessons:Array<{id:string;grade:number;content:string;learningObjectives:string[];
 questions:Array<{order:number;question:string;options:Array<{id:string;text:string}>}>;
 retainedQuestionOrders:number[];
 activities:Array<{order:number;type:string;prompt:string;options?:string[]}>}>;
};
describe("original Bahrain Grade 1-3 listening instructions",()=>{
 it("preserves exactly three existing lesson IDs, with no false audio claim",()=>{
  expect(pack.skill).toBe("الاستماع واتباع التعليمات");
  expect(pack.country).toBe("BH");
  expect(pack.grades).toEqual([1,2,3]);
  expect(pack.lessons.map(l=>l.grade)).toEqual([1,2,3]);
  expect(pack.lessons.map(l=>l.id)).toEqual([
   "2ff0f9c9-d23e-4ada-8490-7a554d3a6ffa",
   "6245263b-9564-4aa1-8419-efa887ab45ff",
   "a0beeb5f-4f65-4f86-b385-7028ec5f9b5a"
  ]);
  expect(pack.audioAssetPresent).toBe(false);
  expect(pack.officialMinistryAlignmentVerified).toBe(false);
  expect(pack.teacherInstruction).toContain("Read the original passage aloud");
 });
 it("offers three different, observable listening tasks with explicit objectives and support",()=>{
  expect(new Set(pack.lessons.map(l=>l.content)).size).toBe(3);
  for(const l of pack.lessons){
   expect(l.content.length).toBeGreaterThan(1850);
   expect(l.content).toContain("نشاط الدعم والعلاج");
   expect(l.content).toContain("التقويم الختامي");
   expect(l.content).toContain("نص الاستماع الأصلي");
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(g=>g.startsWith("أن "))).toBe(true);
  }
  expect(pack.lessons[0].content).toContain("اكتب التاريخ");
  expect(pack.lessons[1].content).toContain("نَخْلَةٌ");
  expect(pack.lessons[2].content).toContain("إذا وجدت كلمة");
 });
 it("keeps legitimate Grade 1 questions and replaces 10 poor generic questions",()=>{
  expect(pack.lessons.map(l=>l.questions.length)).toEqual([2,4,4]);
  expect(pack.lessons.map(l=>l.retainedQuestionOrders)).toEqual([[1,3,5],[3],[3]]);
  for(const l of pack.lessons){
   for(const q of l.questions){
    expect(q.options.map(x=>x.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(x=>x.text)).size).toBe(3);
    expect(q.question).not.toMatch(/ما المهارة الرئيسة|أي تطبيق يساعدك|ما الخطوة الأفضل بعد فهم|كيف تتحقق من إتقان/u);
   }
   expect(l.activities.map(a=>a.order)).toEqual([1,2,3]);
   expect(l.activities.map(a=>a.type)).toEqual(["multiple_choice","multiple_choice","listening"]);
  }
 });
 it("does not expose private grading answers in the public lesson source",()=>{
  expect(pack.containsAnswerKeys).toBe(false);
  expect(raw).not.toMatch(/"correct_answer"\s*:|"correctAnswer"\s*:|"model_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:|"answer"\s*:/u);
 });
});