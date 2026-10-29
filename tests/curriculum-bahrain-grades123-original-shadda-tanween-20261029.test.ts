import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const raw=readFileSync(resolve(process.cwd(),
 "data/curriculum-drafts/bahrain-grade123-shadda-tanween-original-20261029.json"),"utf8");
const pack=JSON.parse(raw) as {
 containsAnswerKeys:boolean;country:string;skill:string;
 lessons:Array<{id:string;grade:number;summary:string;content:string;learningObjectives:string[];
 vocabulary:Array<{word:string;meaning:string}>;
 questions:Array<{order:number;question:string;options:Array<{id:string;text:string}>}>;
 retainedQuestionOrders:number[];
 activities:Array<{order:number;title:string;prompt:string;type:string;options?:string[]}>}>
};
describe("Bahrain original Grade1–3 shadda and tanween remediation",()=>{
 it("uses the three original lesson identifiers without falsely asserting ministry alignment",()=>{
  expect(pack.skill).toBe("الشدة والتنوين");
  expect(pack.country).toBe("BH");
  expect(pack.lessons.map(x=>x.grade)).toEqual([1,2,3]);
  expect(pack.lessons.map(x=>x.id)).toEqual([
   "12ccea39-0dd2-4d51-a162-f1a940405c2b",
   "d05b894c-db40-456d-a8b5-5cb238959f87",
   "6abcbccd-f078-4d06-9e09-5df43274e4c0"
  ]);
 });
 it("contains truly different age-graded teaching content with SMART and differential practice",()=>{
  expect(new Set(pack.lessons.map(x=>x.content)).size).toBe(3);
  for(const l of pack.lessons){
   expect(l.content.length).toBeGreaterThan(1500);
   expect(l.content).toContain("الشدة");
   expect(l.content).toContain("التنوين");
   expect(l.content).toContain("الدعم");
   expect(l.content).toContain("تقويم ختامي");
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(o=>o.startsWith("أن "))).toBe(true);
   expect(l.vocabulary).toHaveLength(3);
  }
  expect(pack.lessons[0].content).toContain("قَلَمٌ");
  expect(pack.lessons[1].content).toContain("كِتَابٍ");
  expect(pack.lessons[2].content).toContain("قَرَأْتُ كِتَابًا");
 });
 it("retains legitimate questions and replaces only identified generic stems",()=>{
  expect(pack.lessons.map(x=>x.questions.length)).toEqual([2,4,4]);
  expect(pack.lessons.map(x=>x.retainedQuestionOrders)).toEqual([[1,3,5],[3],[3]]);
  for(const l of pack.lessons){
   for(const q of l.questions){
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.question).not.toMatch(/ما المهارة الرئيسة|أي تطبيق يساعدك|ما الخطوة الأفضل|كيف تتحقق/u);
   }
   expect(l.activities.map(a=>a.order)).toEqual([1,2,3]);
   expect(l.activities[2].type).toBe(l.grade===1?"reading":"writing");
   expect(l.activities.every(a=>a.prompt.length>30)).toBe(true);
  }
 });
 it("stores no private answer keys or scoring explanations in public curriculum",()=>{
  expect(pack.containsAnswerKeys).toBe(false);
  expect(raw).not.toMatch(/"correct_answer"\s*:|"correctAnswer"\s*:|"model_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:|"answer"\s*:/u);
 });
});