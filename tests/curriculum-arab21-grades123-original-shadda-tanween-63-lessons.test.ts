import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
type Lesson={id:string;countryCode:string;country:string;grade:number;title:string;content:string;
 learningObjectives:string[];vocabulary:Array<{word:string;meaning:string}>;instructions:string[];
 questions:Array<{order:number;question:string;options:Array<{id:string;text:string}>}>;
 retainedQuestionOrder:number;
 activities:Array<{order:number;title:string;type:string;prompt:string;content:{origin:string;options?:string[];text?:string}}>};
const raw=readFileSync(resolve(process.cwd(),"data/curriculum-drafts/arab21-grades123-shadda-tanween-63-original-20261029.json"),"utf8");
const pack=JSON.parse(raw) as {skill:string;countryCount:number;containsAnswerKeys:boolean;sourceScope:string;lessons:Lesson[]};
const countryCodes="AE DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");
describe("63 original Grade 1-3 shadda/tanween lessons, 21 countries",()=>{
 it("covers 21 countries x 3 original lesson UUIDs without a ministry matching claim",()=>{
  expect(pack.skill).toBe("الشدة والتنوين");
  expect(pack.countryCount).toBe(21);
  expect(pack.lessons).toHaveLength(63);
  expect(new Set(pack.lessons.map(l=>l.id)).size).toBe(63);
  expect([...new Set(pack.lessons.map(l=>l.countryCode))].sort()).toEqual([...countryCodes].sort());
  for(const c of countryCodes)expect(pack.lessons.filter(l=>l.countryCode===c).map(l=>l.grade).sort()).toEqual([1,2,3]);
  expect(pack.sourceScope).toContain("not officially matched");
 });
 it("contains different context-linked teaching texts and three graded observable objectives",()=>{
  expect(new Set(pack.lessons.map(l=>l.content)).size).toBe(63);
  for(const l of pack.lessons){
   expect(l.title).toBe("الشدة والتنوين");
   expect(l.content.length).toBeGreaterThan(1500);
   expect(l.content).toContain(l.country);
   expect(l.content).toContain("نشاط الدعم والعلاج");
   expect(l.content).toContain("نشاط التحدي والإثراء");
   expect(l.content).toContain("تقويم ختامي");
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(x=>x.startsWith("أن "))).toBe(true);
   expect(l.vocabulary).toHaveLength(3);
   expect(l.instructions).toHaveLength(3);
  }
 });
 it("replaces 252 generic stems with meaningful phonics/morphology choices but retains correct Q3",()=>{
  expect(pack.lessons.every(l=>l.retainedQuestionOrder===3)).toBe(true);
  for(const l of pack.lessons){
   expect(l.questions.map(q=>q.order)).toEqual([1,2,4,5]);
   for(const q of l.questions){
    expect(q.question).not.toMatch(/ما المهارة الرئيسة|أي تطبيق يساعدك|ما الخطوة الأفضل|كيف تتحقق من إتقان/u);
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
   }
  }
 });
 it("contains 2 real scored tasks and one age-appropriate independent task per lesson",()=>{
  for(const l of pack.lessons){
   expect(l.activities.map(a=>a.order)).toEqual([1,2,3]);
   expect(l.activities.slice(0,2).every(a=>a.type==="multiple_choice"&&a.content.options?.length===3)).toBe(true);
   expect(l.activities[2].type).toBe(l.grade===1?"reading":"writing");
   expect(l.activities.every(a=>a.prompt.length>35 && a.content.origin==="DADYOOM_SHADDA_TANWEEN_21_G123_ORIGINAL_20261029")).toBe(true);
  }
 });
 it("never publishes answer identifiers, model answers, user data or grading explanations",()=>{
  expect(pack.containsAnswerKeys).toBe(false);
  expect(raw).not.toMatch(/"correct_answer"\s*:|"correctAnswer"\s*:|"model_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:|"answer"\s*:/u);
  expect(raw).not.toMatch(/"student_id"\s*:|"selected_answer"\s*:/u);
 });
});
