import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
type Lesson={id:string;grade:number;content:string;learningObjectives:string[];questions:Array<{order:number;question:string;options:Array<{id:string;text:string}>}>;retainedQuestionOrders:number[];activities:Array<{order:number;title:string;type:string;prompt:string;options?:string[]}>};
const raw=readFileSync(resolve(process.cwd(),"data/curriculum-drafts/bahrain-grade123-letter-shapes-joined-disjoined-original-20261029.json"),"utf8");
const pack=JSON.parse(raw) as {countryCode:string;skill:string;containsAnswerKeys:boolean;lessons:Lesson[]};
describe("Bahrain original letter shape and joining repair for Grades 1–3",()=>{
 it("retains original published UUIDs and three grades",()=>{
  expect(pack.countryCode).toBe("BH");
  expect(pack.skill).toBe("أشكال الحرف في الكلمة");
  expect(pack.lessons.map(x=>x.grade)).toEqual([1,2,3]);
  expect(pack.lessons.map(x=>x.id)).toEqual([
   "7f57bcbf-c78e-4c3c-a3ae-e3fc617e1bdc",
   "6f75045f-e562-446f-b351-e73f570fc684",
   "842dfa03-9eff-4c49-ade9-d7a526b503db"
  ]);
 });
 it("distinguishes character position from ligature joining across grades",()=>{
  for(const l of pack.lessons){
   expect(l.content.length).toBeGreaterThan(1350);
   expect(l.content).toContain("قَلْب");
   expect(l.content).toContain("كِتَاب");
   expect(l.content).toContain("الألف");
   expect(l.content).toContain("نشاط الدعم والعلاج");
   expect(l.content).toContain("تقويم ختامي");
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(x=>x.startsWith("أن "))).toBe(true);
   expect(l.activities.map(a=>a.order)).toEqual([1,2,3]);
   expect(l.activities[2].type).toBe(l.grade===1?"reading":"writing");
   expect(l.activities[2].prompt.length).toBeGreaterThan(35);
  }
  expect(pack.lessons[2].content).toContain("الدال والذال والراء والزاي والواو");
 });
 it("replaces only generic MCQs, retaining previously valid first-grade items",()=>{
  expect(pack.lessons.map(x=>x.questions.length)).toEqual([2,4,4]);
  expect(pack.lessons.map(x=>x.retainedQuestionOrders)).toEqual([[1,3,5],[3],[3]]);
  for(const l of pack.lessons){
   for(const q of l.questions){
    expect(q.question).not.toMatch(/ما المهارة الرئيسة|أي تطبيق يساعدك|ما الخطوة الأفضل|كيف تتحقق/u);
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
   }
  }
 });
 it("keeps scoring keys and student response fields out of GitHub",()=>{
  expect(pack.containsAnswerKeys).toBe(false);
  expect(raw).not.toMatch(/"correct_answer"\s*:|"model_answer"\s*:|"explanation"\s*:|"answer"\s*:/u);
 });
});