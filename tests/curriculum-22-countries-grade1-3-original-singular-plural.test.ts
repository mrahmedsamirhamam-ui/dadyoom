import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Noun = {s:string;p:string;type:string};
type Question = {order:number;question:string;options:{id:string;text:string}[]};
type Lesson = {
 id:string;code:string;country:string;grade:number;title:string;
 context:string;examples:Noun[];content:string;summary:string;
 learningObjectives:string[];vocabulary:{word:string;meaning:string}[];
 questions:Question[];openInstructions:string;
};
const file="data/curriculum-drafts/arab22-grade1-3-original-singular-plural-66-lessons-20261028.json";
const raw=readFileSync(resolve(process.cwd(),file),"utf8");
const pack=JSON.parse(raw) as {countries:number;grades:number[];containsAnswerKeys:boolean;lessons:Lesson[]};
const codes="AE BH DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");
describe("Original Arabic singular/plural lessons in 22 countries at Grades 1-3",()=>{
 it("covers all 22 countries and exactly one lesson per primary grade",()=>{
  expect(pack.countries).toBe(22);
  expect(pack.grades).toEqual([1,2,3]);
  expect(pack.lessons).toHaveLength(66);
  expect(new Set(pack.lessons.map(l=>l.id)).size).toBe(66);
  expect([...new Set(pack.lessons.map(l=>l.code))].sort()).toEqual([...codes].sort());
  for(const code of codes) expect(pack.lessons.filter(l=>l.code===code).map(l=>l.grade).sort()).toEqual([1,2,3]);
 });
 it("keeps authentic and grammatically categorized singular/plural pairs",()=>{
  for(const l of pack.lessons){
   expect(l.title).toBe("المفرد والجمع");
   expect(l.examples).toHaveLength(3);
   expect(l.examples.some(e=>e.type==="جمع مؤنث سالم")).toBe(true);
   expect(l.examples.some(e=>e.type==="جمع تكسير")).toBe(true);
   expect(new Set(l.examples.map(e=>e.s)).size).toBe(3);
   expect(new Set(l.examples.map(e=>e.p)).size).toBe(3);
   for(const ex of l.examples){
    expect(ex.s.length).toBeGreaterThan(1);
    expect(ex.p.length).toBeGreaterThan(1);
    expect(l.context).toContain(ex.s);
    expect(l.context).toContain(ex.p);
   }
   expect(l.content).toContain(l.context);
   expect(l.content).toContain("نشاط الدعم:");
   expect(l.content).toContain("نشاط التطبيق:");
   expect(l.content).toContain("نشاط التحدي:");
   expect(l.content).toContain("ليست نصًا وزاريًا");
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(x=>x.startsWith("أن "))).toBe(true);
   expect(l.vocabulary).toHaveLength(3);
  }
 });
 it("provides 330 non-generic MCQs and demonstrates progression across grades",()=>{
  let n=0;
  for(const l of pack.lessons){
   expect(l.questions).toHaveLength(5);
   expect(l.questions.map(q=>q.order)).toEqual([1,2,3,4,5]);
   for(const q of l.questions){
    n++;
    expect(q.options.map(x=>x.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(x=>x.text)).size).toBe(3);
    expect(q.question).not.toMatch(/ما المهارة الرئيسة التي يتدرب|كيف تتحقق من إتقان المهارة الأساسية|ما الخطوة الأفضل بعد فهم مثال درس|أي تطبيق يساعدك على إتقان درس/u);
   }
   if(l.grade===1) expect(l.questions[0].question).toContain("الجمع الصحيح");
   if(l.grade===2) expect(l.questions[2].question).toContain("جملة");
   if(l.grade===3){
    expect(l.questions[0].question).toContain("نصنف");
    expect(l.questions[2].question).toContain("جمع مؤنث سالم");
    expect(l.questions[3].question).toContain("جمع تكسير");
   }
  }
  expect(n).toBe(330);
 });
 it("never commits grading answers or teacher-only answer examples into public JSON",()=>{
  expect(pack.containsAnswerKeys).toBe(false);
  expect(raw).not.toMatch(/"correctAnswer"\s*:|"correct_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:/);
 });
});
