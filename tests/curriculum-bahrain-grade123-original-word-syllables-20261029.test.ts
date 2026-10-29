import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
const raw=readFileSync(resolve(process.cwd(),"data/curriculum-drafts/bahrain-grades123-word-syllables-original-20261029.json"),"utf8");
const pack=JSON.parse(raw) as {skill:string;country:string;containsAnswerKeys:boolean;officialTocVerified:boolean;lessons:Array<{
 id:string;grade:number;content:string;learningObjectives:string[];vocabulary:Array<{word:string;meaning:string}>;
 retainedQuestionOrders:number[];questions:Array<{order:number;question:string;options:Array<{id:string;text:string}>}>;
 activities:Array<{order:number;title:string;type:string;prompt:string;options?:string[]}>
}>};
describe("Bahrain original Grade 1–3 syllable blending and word construction",()=>{
 it("preserves the three original lesson UUIDs with correct grade and scope",()=>{
  expect(pack.skill).toBe("بناء الكلمة من المقاطع");
  expect(pack.country).toBe("BH");
  expect(pack.officialTocVerified).toBe(false);
  expect(pack.lessons.map(x=>x.grade)).toEqual([1,2,3]);
  expect(pack.lessons.map(x=>x.id)).toEqual([
   "c4b21875-effe-4a47-bf42-29843790b21c",
   "7c3cf296-ddf2-4e87-a57b-b60b5264cfd2",
   "b620830c-a081-4095-99b4-45f27d6551ad"
  ]);
 });
 it("contains distinct learning content and genuine grade-specific phonics differentiation",()=>{
  expect(new Set(pack.lessons.map(x=>x.content)).size).toBe(3);
  for(const x of pack.lessons){
   expect(x.content.length).toBeGreaterThan(1450);
   expect(x.content).toContain("نشاط الدعم والعلاج");
   expect(x.content).toContain("نشاط التحدي والإثراء");
   expect(x.content).toContain("التقويم الختامي");
   expect(x.learningObjectives).toHaveLength(3);
   expect(x.learningObjectives.every(o=>o.startsWith("أن "))).toBe(true);
   expect(x.vocabulary).toHaveLength(3);
  }
  expect(pack.lessons[0].content).toContain("كَ + تَ + بَ");
  expect(pack.lessons[1].content).toContain("مَكْ + تَ + بٌ");
  expect(pack.lessons[2].content).toContain("تَ + عَ + لَّ + مَ");
 });
 it("retains good questions and supplies ten concrete replacement questions with authentic distractors",()=>{
  expect(pack.lessons.map(x=>x.questions.length)).toEqual([2,4,4]);
  expect(pack.lessons.map(x=>x.retainedQuestionOrders)).toEqual([[1,3,5],[3],[3]]);
  for(const l of pack.lessons){
   for(const q of l.questions){
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.question).not.toMatch(/ما المهارة الرئيسة|أي تطبيق يساعدك|ما الخطوة الأفضل|كيف تتحقق/u);
   }
   expect(l.activities.map(a=>a.order)).toEqual([1,2,3]);
   expect(l.activities.map(a=>a.type)).toEqual(["multiple_choice","multiple_choice","writing"]);
  }
 });
 it("publishes no private scoring keys, evaluation model feedback or student answers",()=>{
  expect(pack.containsAnswerKeys).toBe(false);
  expect(raw).not.toMatch(/"correct_answer"\s*:|"correctAnswer"\s*:|"model_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:|"answer"\s*:/u);
 });
});