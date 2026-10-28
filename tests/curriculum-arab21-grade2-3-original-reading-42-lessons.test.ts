import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Quiz = {order:number;question:string;options:{id:string;text:string}[]};
type GradeReading = {
 id:string;code:string;country:string;grade:number;title:string;
 storyTitle:string;story:string;content:string;summary:string;
 learningObjectives:string[];vocabulary:{word:string;meaning:string}[];
 questions:Quiz[];openInstructions:string;
};
const file="data/curriculum-drafts/arab21-grades2-3-original-reading-42-lessons-20261028.json";
const raw=readFileSync(resolve(process.cwd(),file),"utf8");
const packet=JSON.parse(raw) as {countryCount:number;grades:number[];containsAnswerKeys:boolean;lessons:GradeReading[]};
const lessons=packet.lessons;

describe("Original G2/G3 supplementary reading for 21 additional Arab countries",()=>{
 it("covers every non-Bahrain country exactly once per grade, preserving record IDs",()=>{
  expect(packet.countryCount).toBe(21);
  expect(packet.grades).toEqual([2,3]);
  expect(lessons).toHaveLength(42);
  expect(new Set(lessons.map(l=>l.id)).size).toBe(42);
  const codes="AE DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");
  expect([...new Set(lessons.map(l=>l.code))].sort()).toEqual(codes.sort());
  for(const c of codes){
   expect(lessons.filter(l=>l.code===c).map(l=>l.grade).sort()).toEqual([2,3]);
  }
 });
 it("supplies original age-differentiated reading stories and three measurable objectives each",()=>{
  expect(new Set(lessons.map(l=>l.story)).size).toBe(42);
  expect(new Set(lessons.map(l=>l.content.slice(0,500))).size).toBe(42);
  for(const l of lessons){
   expect(l.title).toBe("قراءة نص قصير");
   expect(l.story.length).toBeGreaterThan(260);
   expect(l.content).toContain(l.story);
   expect(l.content).toContain(l.storyTitle);
   expect(l.content).toContain("نشاط الدعم:");
   expect(l.content).toContain("نشاط التطبيق:");
   expect(l.content).toContain("نشاط التحدي:");
   expect(l.content).toMatch(/ليس نص الكتاب الوزاري|ليس اقتباسًا من وزارة التربية/u);
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(o=>o.startsWith("أن "))).toBe(true);
   expect(l.vocabulary).toHaveLength(3);
   expect(l.vocabulary.every(v=>v.word.length>2&&v.meaning.length>12)).toBe(true);
  }
 });
 it("provides 210 source-specific questions with 3 distinct choice texts each",()=>{
  let questionCount=0;
  for(const l of lessons){
   expect(l.questions.map(q=>q.order)).toEqual([1,2,3,4,5]);
   expect(new Set(l.questions.map(q=>q.question)).size).toBe(5);
   for(const q of l.questions){
    questionCount++;
    expect(q.question.length).toBeGreaterThan(18);
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.question).not.toMatch(/ما المهارة الرئيسة التي يتدرب|كيف تتحقق من إتقان المهارة الأساسية|ما الخطوة الأفضل بعد فهم مثال درس|أي تطبيق يساعدك على إتقان درس/u);
   }
  }
  expect(questionCount).toBe(210);
 });
 it("keeps real grading keys and model answers outside committed public source files",()=>{
  expect(packet.containsAnswerKeys).toBe(false);
  expect(raw).not.toMatch(/"correctAnswer"\s*:|"correct_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:/);
  expect(raw).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|service_role/);
 });
});
