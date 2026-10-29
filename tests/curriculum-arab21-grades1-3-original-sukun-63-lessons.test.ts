import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Item = { order: number; question: string; options: {id:string;text:string}[] };
type Activity = { order: number; title: string; type: string; prompt: string; content: {origin:string;options?:string[];text?:string} };
type Lesson = {
 id:string; countryCode:string; country:string; grade:number; title:string; summary:string; content:string;
 learningObjectives:string[]; vocabulary:{word:string;meaning:string}[]; instructions:string[];
 questions:Item[]; activities:Activity[]; retainedQuestion:{order:number;note:string}
};
const raw=readFileSync(resolve(process.cwd(),
 "data/curriculum-drafts/arab21-grades1-3-sukun-63-original-20261029.json"),"utf8");
const pack=JSON.parse(raw) as {
 containsAnswerKeys:boolean; counts:{countries:number;lessons:number;replacedGenericQuestions:number;retainedExistingQuestions:number;activities:number};
 lessons:Lesson[]
};
const codeList="AE DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");
const generic=/ما المهارة الرئيسة|أي تطبيق يساعدك على إتقان درس|ما الخطوة الأفضل بعد فهم مثال درس|كيف تتحقق من إتقان المهارة الأساسية|أي اختيار يطبّق ما تعلمته/iu;
describe("63 real sukun lessons in remaining 21 Arab countries (Grades 1-3)",()=>{
 it("preserves one unique UUID per country and grade without silently adding a ministry title",()=>{
  expect(pack.counts).toEqual({
   countries:21,lessons:63,replacedGenericQuestions:252,retainedExistingQuestions:63,activities:189
  });
  expect(pack.lessons).toHaveLength(63);
  expect(new Set(pack.lessons.map(x=>x.id)).size).toBe(63);
  expect([...new Set(pack.lessons.map(x=>x.countryCode))].sort()).toEqual([...codeList].sort());
  for(const code of codeList)expect(pack.lessons.filter(x=>x.countryCode===code).map(x=>x.grade).sort()).toEqual([1,2,3]);
  expect(pack.lessons.every(x=>x.countryCode!=="BH" && x.title==="السكون والمقطع")).toBe(true);
 });
 it("contains contextual, original, instructional content, including measurable goals and differentiation",()=>{
  expect(new Set(pack.lessons.map(x=>x.content)).size).toBe(63);
  for(const l of pack.lessons){
   expect(l.content.length).toBeGreaterThan(1450);
   expect(l.content).toContain(l.country);
   expect(l.content).toContain("نشاط الدعم والعلاج");
   expect(l.content).toContain("نشاط التحدي والإثراء");
   expect(l.content).toContain("تقويم ختامي");
   expect(l.content).toContain("لا يُدعى");
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(x=>x.startsWith("أن "))).toBe(true);
   expect(l.vocabulary).toHaveLength(3);
   expect(l.instructions).toHaveLength(3);
  }
 });
 it("gives four phonics-specific replacements while retaining the established vocabulary question",()=>{
  for(const l of pack.lessons){
   expect(l.retainedQuestion.order).toBe(3);
   expect(l.questions.map(q=>q.order)).toEqual([1,2,4,5]);
   expect(new Set(l.questions.map(q=>q.question)).size).toBe(4);
   for(const q of l.questions){
    expect(q.question).not.toMatch(generic);
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
   }
  }
 });
 it("includes two scored tasks and one age-appropriate non-key-leaking production task",()=>{
  for(const l of pack.lessons){
   expect(l.activities.map(a=>a.order)).toEqual([1,2,3]);
   expect(l.activities.slice(0,2).every(a=>a.type==="multiple_choice" && a.content.options?.length===3)).toBe(true);
   expect(l.activities[2].type).toBe(l.grade===1?"reading":"writing");
   expect(l.activities[2].prompt).not.toMatch(generic);
   expect(l.activities.every(a=>a.prompt.length>35 && a.content.origin==="DADYOOM_SUKUN_21_COUNTRIES_G123_ORIGINAL_20261029")).toBe(true);
  }
 });
 it("never exposes scoring keys, learner answers or private feedback through the public pack",()=>{
  expect(pack.containsAnswerKeys).toBe(false);
  expect(raw).not.toMatch(/"correct_answer"\s*:|"correctAnswer"\s*:|"model_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:|"answer"\s*:/iu);
  expect(raw).not.toMatch(/"student_id"\s*:|"selected_answer"\s*:/iu);
 });
});
