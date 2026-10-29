import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
type Question={order:number;question:string;options:Array<{id:string;text:string}>};
type Activity={order:number;title:string;type:string;prompt:string;content:{origin:string;requiresTeacherRead:boolean;audioAssetPresent:boolean;options?:string[];text?:string}};
type Lesson={id:string;countryCode:string;country:string;grade:number;title:string;content:string;learningObjectives:string[];
 vocabulary:Array<{word:string;meaning:string}>;instructions:string[];retainedQuestionOrder:number;questions:Question[];activities:Activity[]};
const path="data/curriculum-drafts/arab21-grades123-listening-original-63-20261029.json";
const raw=readFileSync(resolve(process.cwd(),path),"utf8");
const pack=JSON.parse(raw) as {skill:string;countryCount:number;gradeRange:number[];containsAnswerKeys:boolean;
 audioAssetPresent:boolean;officialMinistryAlignmentVerified:boolean;sourceScope:string;bahrain:string;
 counts:{lessons:number;replacedGenericQuestions:number;retainedDefinitionQuestions:number;activities:number};lessons:Lesson[]};
const codes="AE DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");
const generic=/ما المهارة الرئيسة|أي تطبيق يساعدك|ما الخطوة الأفضل بعد فهم|كيف تتحقق من إتقان/u;
describe("63 age-graded original teacher-read listening lessons across 21 Arab countries",()=>{
 it("keeps exact country, grade and lesson coverage, excluding previously updated Bahrain",()=>{
  expect(pack.skill).toBe("الاستماع واتباع التعليمات");
  expect(pack.countryCount).toBe(21);
  expect(pack.gradeRange).toEqual([1,2,3]);
  expect(pack.counts).toEqual({lessons:63,replacedGenericQuestions:252,retainedDefinitionQuestions:63,activities:189});
  expect(pack.lessons).toHaveLength(63);
  expect(new Set(pack.lessons.map(l=>l.id)).size).toBe(63);
  expect([...new Set(pack.lessons.map(l=>l.countryCode))].sort()).toEqual([...codes].sort());
  expect(pack.lessons.every(l=>l.countryCode!=="BH")).toBe(true);
  for(const c of codes)expect(pack.lessons.filter(l=>l.countryCode===c).map(l=>l.grade).sort()).toEqual([1,2,3]);
 });
 it("has 63 original country-linked texts with observable three-goal instruction and differentiated support",()=>{
  expect(new Set(pack.lessons.map(l=>l.content)).size).toBe(63);
  for(const l of pack.lessons){
   expect(l.content.length).toBeGreaterThan(1550);
   expect(l.content).toContain(l.country);
   expect(l.content).toContain("نص الاستماع الأصلي");
   expect(l.content).toContain("نشاط الدعم والعلاج");
   expect(l.content).toContain("نشاط التحدي والإثراء");
   expect(l.content).toContain("التقويم الختامي");
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(g=>g.startsWith("أن "))).toBe(true);
   expect(l.vocabulary).toHaveLength(3);
   expect(l.instructions).toHaveLength(3);
  }
 });
 it("replaces four generic questions per lesson while retaining valid question 3",()=>{
  for(const l of pack.lessons){
   expect(l.retainedQuestionOrder).toBe(3);
   expect(l.questions.map(q=>q.order)).toEqual([1,2,4,5]);
   expect(new Set(l.questions.map(q=>q.question)).size).toBe(4);
   for(const q of l.questions){
    expect(q.question).not.toMatch(generic);
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
   }
  }
 });
 it("creates two scored comprehension questions plus one genuine teacher-read listening task",()=>{
  for(const l of pack.lessons){
   expect(l.activities.map(a=>a.order)).toEqual([1,2,3]);
   expect(l.activities.map(a=>a.type)).toEqual(["multiple_choice","multiple_choice","listening"]);
   expect(l.activities.slice(0,2).every(a=>a.content.options?.length===3)).toBe(true);
   expect(l.activities.every(a=>a.content.origin==="DADYOOM_ARAB21_LISTENING_G123_ORIGINAL_20261029")).toBe(true);
   expect(l.activities.every(a=>a.content.requiresTeacherRead===true&&a.content.audioAssetPresent===false)).toBe(true);
  }
 });
 it("never claims real audio exists or publishes private answer keys and student data",()=>{
  expect(pack.audioAssetPresent).toBe(false);
  expect(pack.officialMinistryAlignmentVerified).toBe(false);
  expect(pack.containsAnswerKeys).toBe(false);
  expect(pack.sourceScope).toContain("teacher-read");
  expect(raw).not.toMatch(/"correct_answer"\s*:|"correctAnswer"\s*:|"model_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:|"answer"\s*:/u);
  expect(raw).not.toMatch(/"student_id"\s*:|"selected_answer"\s*:/u);
 });
});