import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
type Quiz={order:number;question:string;options:{id:string;text:string}[]};
type Lesson={id:string;code:string;country:string;grade:number;title:string;sunWords:string[];moonWords:string[];content:string;
 learningObjectives:string[];vocabulary:{word:string;meaning:string}[];questions:Quiz[];openInstructions:string};
const file="data/curriculum-drafts/arab22-grades1-3-sun-moon-lam-66-original-lessons-20261028.json";
const raw=readFileSync(resolve(process.cwd(),file),"utf8");
const pack=JSON.parse(raw) as {countryCount:number;grades:number[];containsAnswerKeys:boolean;lessons:Lesson[]};
const codes="AE BH DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");
const stripVowels=(v:string)=>v.normalize("NFD").replace(/[\u064b-\u065f\u0670]/g,"");
const afterAl=(w:string)=>stripVowels(w).slice(2,3).replace(/[أإآ]/g,"ا");
const sunLetters="تثدذرزسشصضطظلن";
const moonLetters="ابجحخعغفقكمهوي";
describe("22-country original lam shamsiyya / qamariyya lesson pack, Grades 1-3",()=>{
 it("covers exactly 66 existing country-grade lessons",()=>{
  expect(pack.countryCount).toBe(22);
  expect(pack.grades).toEqual([1,2,3]);
  expect(pack.lessons).toHaveLength(66);
  expect(new Set(pack.lessons.map(x=>x.id)).size).toBe(66);
  expect([...new Set(pack.lessons.map(x=>x.code))].sort()).toEqual([...codes].sort());
  for(const code of codes) expect(pack.lessons.filter(x=>x.code===code).map(x=>x.grade).sort()).toEqual([1,2,3]);
 });
 it("uses genuine sun and moon examples with age-differentiated objectives and scaffolding",()=>{
  expect(new Set(pack.lessons.map(x=>x.content.slice(0,500))).size).toBe(66);
  for(const l of pack.lessons){
   expect(l.title).toBe("اللام الشمسية والقمرية");
   expect(l.sunWords).toHaveLength(2);
   expect(l.moonWords).toHaveLength(2);
   expect(new Set([...l.sunWords,...l.moonWords]).size).toBe(4);
   expect(l.sunWords.every(w=>sunLetters.includes(afterAl(w)))).toBe(true);
   expect(l.moonWords.every(w=>moonLetters.includes(afterAl(w)))).toBe(true);
   expect(l.content).toContain("نشاط الدعم:");
   expect(l.content).toContain("نشاط التطبيق:");
   expect(l.content).toContain("نشاط التحدي:");
   expect(l.content).toContain("لا تدعي نقل نص كتاب وزاري");
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(o=>o.startsWith("أن "))).toBe(true);
   expect(l.vocabulary).toHaveLength(3);
   expect(l.vocabulary.every(v=>v.word.length>2&&v.meaning.length>15)).toBe(true);
  }
 });
 it("has 330 specific questions with distinct choices, no generic 'describe the skill' prompts",()=>{
  let count=0;
  for(const l of pack.lessons){
   expect(l.questions.map(q=>q.order)).toEqual([1,2,3,4,5]);
   expect(new Set(l.questions.map(q=>q.question)).size).toBe(5);
   for(const q of l.questions){
    count++;
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.question).not.toMatch(/ما المهارة الرئيسة التي يتدرب|كيف تتحقق من إتقان المهارة الأساسية|ما الخطوة الأفضل بعد فهم مثال درس|أي تطبيق يساعدك على إتقان درس/u);
   }
  }
  expect(count).toBe(330);
 });
 it("keeps answers and grading explanations private to the database",()=>{
  expect(pack.containsAnswerKeys).toBe(false);
  expect(raw).not.toMatch(/"correctAnswer"\s*:|"correct_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:/);
 });
});


describe("production repair guards for existing 66 lam lessons",()=>{
 const sql=readFileSync(resolve(process.cwd(),"scripts/curriculum-22-countries-grades1-3-sun-moon-lam-prompts-feedback-repair-20261029.sql"),"utf8");
 const nextSql=readFileSync(resolve(process.cwd(),"scripts/curriculum-22-countries-grades1-3-short-vowels-and-singular-plural-prompts-20261029.sql"),"utf8");
 it("refuses concurrent learner attempts and unexpected row counts",()=>{
  for(const file of [sql,nextSql]){
   expect(file).toContain("student_lesson_progress");
   expect(file).toContain("lesson_activity_attempts");
   expect(file).toContain("question_attempts");
   expect(file).toContain("student_answers");
   expect(file).toContain("lesson_mastery");
   expect(file).toContain("RAISE EXCEPTION");
   expect(file).toContain("GET DIAGNOSTICS");
   expect(file).toContain("SET LOCAL lock_timeout");
   expect(file).not.toMatch(/\bDELETE\s+FROM\b/i);
  }
  expect(sql).toContain("target_count <> 66");
  expect(sql).toContain("n<>198");
  expect(sql).toContain("n<>330");
  expect(nextSql).toContain("<> 132");
  expect(nextSql).toContain("n<>396");
 });
 it("does not replace question IDs, options, or private scoring keys",()=>{
  expect(sql).toContain("UPDATE public.questions q");
  expect(sql).toMatch(/SET explanation=CASE/u);
  expect(sql).not.toMatch(/SET\s+correct_answer\s*=/iu);
  expect(sql).not.toMatch(/SET\s+options\s*=/iu);
  expect(nextSql).not.toContain("UPDATE public.questions");
  expect(nextSql).toMatch(/SET prompt=a.instructions, updated_at=now\(\)/u);
 });
});


describe("guarded 66-lesson madd prompts production repair", () => {
 const sql=readFileSync(resolve(process.cwd(),"scripts/curriculum-22-countries-grade123-madd-prompts-repair-20261029.sql"),"utf8");
 it("requires exactly 66 published lessons and 198 old activity prompts",()=>{
   expect(sql).toContain("<>66");
   expect(sql).toContain("<>198");
   expect(sql).toContain("n<>198");
   expect(sql).toContain("BEGIN ISOLATION LEVEL SERIALIZABLE");
   expect(sql).toContain("SET LOCAL lock_timeout");
   expect(sql).toContain("student_lesson_progress");
   expect(sql).toContain("student_answers");
   expect(sql).toContain("question_attempts");
   expect(sql).toContain("lesson_activity_attempts");
   expect(sql).toContain("lesson_mastery");
   expect(sql).toContain("SET prompt=a.instructions,updated_at=now()");
   expect(sql).not.toMatch(/\bDELETE\s+FROM\b/i);
   expect(sql).not.toContain("UPDATE public.questions");
 });
});
