import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Question={order:number;question:string;options:Array<{id:string;text:string}>};
type Activity={order:number;title:string;type:string;prompt:string;content:{origin:string;options?:string[];text?:string}};
type Lesson={
 id:string;countryCode:string;country:string;grade:number;title:string;letter:string;
 content:string;learningObjectives:string[];vocabulary:Array<{word:string;meaning:string}>;
 instructions:string[];retainedQuestionOrder:number;questions:Question[];activities:Activity[];
};
const path="data/curriculum-drafts/arab21-grades123-letter-shapes-original-63-20261029.json";
const raw=readFileSync(resolve(process.cwd(),path),"utf8");
const pack=JSON.parse(raw) as {
 skill:string;countryCount:number;gradeRange:number[];hasAnswerKeys:boolean;
 bahrain:string;alignment:string;lessons:Lesson[]
};
const codes="AE DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");
const oldGeneric=/ما المهارة الرئيسة|أي تطبيق يساعدك|ما الخطوة الأفضل بعد فهم|كيف تتحقق من إتقان/u;
describe("Dadyoom 63 original Grade 1–3 Arabic letter-form lessons",()=>{
 it("covers 21 countries and grades 1–3, never overwriting the three existing Bahrain lessons",()=>{
  expect(pack.skill).toBe("أشكال الحرف في الكلمة");
  expect(pack.countryCount).toBe(21);
  expect(pack.gradeRange).toEqual([1,2,3]);
  expect(pack.lessons).toHaveLength(63);
  expect(new Set(pack.lessons.map(x=>x.id)).size).toBe(63);
  expect([...new Set(pack.lessons.map(x=>x.countryCode))].sort()).toEqual([...codes].sort());
  expect(pack.lessons.every(x=>x.countryCode!=="BH")).toBe(true);
  expect(pack.bahrain).toContain("untouched");
  for(const code of codes)expect(pack.lessons.filter(x=>x.countryCode===code).map(x=>x.grade).sort()).toEqual([1,2,3]);
 });
 it("contains different, differentiated, original reading texts with 3 explicit objectives per lesson",()=>{
  expect(new Set(pack.lessons.map(x=>x.content)).size).toBe(63);
  for(const lesson of pack.lessons){
   expect(lesson.title).toBe("أشكال الحرف في الكلمة");
   expect(["ب","م","س","ك"]).toContain(lesson.letter);
   expect(lesson.content.length).toBeGreaterThan(1550);
   expect(lesson.content).toContain(lesson.country);
   expect(lesson.content).toContain("نشاط الدعم والعلاج");
   expect(lesson.content).toContain("نشاط التحدي والإثراء");
   expect(lesson.content).toContain("التقويم الختامي");
   expect(lesson.content).toContain("ليس نقلًا من كتاب الوزارة");
   expect(lesson.learningObjectives).toHaveLength(3);
   expect(lesson.learningObjectives.every(x=>x.startsWith("أن "))).toBe(true);
   expect(lesson.vocabulary).toHaveLength(3);
   expect(lesson.instructions).toHaveLength(3);
  }
 });
 it("contains four replacement questions per lesson with meaningful phonemic prompts and 3 unique distractors",()=>{
  for(const lesson of pack.lessons){
   expect(lesson.retainedQuestionOrder).toBe(3);
   expect(lesson.questions.map(q=>q.order)).toEqual([1,2,4,5]);
   for(const q of lesson.questions){
    expect(q.question).not.toMatch(oldGeneric);
    expect(q.options.map(x=>x.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(x=>x.text)).size).toBe(3);
   }
  }
 });
 it("contains two marked-choice exercises and an independent age-appropriate production task",()=>{
  for(const lesson of pack.lessons){
   expect(lesson.activities.map(a=>a.order)).toEqual([1,2,3]);
   expect(lesson.activities.slice(0,2).every(a=>a.type==="multiple_choice"&&a.content.options?.length===3)).toBe(true);
   expect(lesson.activities[2].type).toBe(lesson.grade===1?"reading":"writing");
   expect(lesson.activities.every(a=>a.prompt.length>20&&a.content.origin==="DADYOOM_ARAB21_LETTER_SHAPES_G123_ORIGINAL_20261029")).toBe(true);
   expect(lesson.grade!==3||lesson.content.includes("نهاية الكلمتين")).toBe(true);
  }
 });
 it("does not disclose answer IDs, correct options, student data or private explanations",()=>{
  expect(pack.hasAnswerKeys).toBe(false);
  expect(pack.alignment).toContain("not completed");
  expect(raw).not.toMatch(/"correct_answer"\s*:|"correctAnswer"\s*:|"model_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:|"answer"\s*:/u);
  expect(raw).not.toMatch(/"student_id"\s*:|"selected_answer"\s*:/u);
 });
});
