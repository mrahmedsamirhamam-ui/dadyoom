import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
const raw=readFileSync(resolve(process.cwd(),"data/curriculum-drafts/bahrain-grade123-sounds-letters-original-20261029.json"),"utf8");
const pack=JSON.parse(raw) as {containsAnswerKeys:boolean;lessons:Array<{
 id:string;grade:number;content:string;databaseApplicationStatus:string;learningObjectives:string[];
 questions:Array<{order:number;question:string;options:Array<{id:string;text:string}>}>;
 retainedQuestionOrders:number[];
 activities:Array<{order:number;title:string;type:string;prompt:string;options?:string[]}>}>};
describe("Bahrain original Grade 2-3 phonics and blocked Grade 1",()=>{
 it("proves the learner-used Grade 1 record is explicitly blocked, not reported as applied",()=>{
  expect(pack.lessons.map(x=>x.grade)).toEqual([1,2,3]);
  expect(pack.lessons[0].id).toBe("5c87c1a0-b7fe-4dcb-8bc6-60b06449302c");
  expect(pack.lessons[0].databaseApplicationStatus).toBe("blocked_existing_125_student_activity_attempts");
  expect(pack.lessons.slice(1).every(x=>x.databaseApplicationStatus==="applied_verified_2026-10-29")).toBe(true);
 });
 it("contains grade-specific original sounds and letters lessons for Grade 2 and 3",()=>{
  const completed=pack.lessons.slice(1);
  expect(new Set(completed.map(x=>x.content)).size).toBe(2);
  for(const l of completed){
   expect(l.content.length).toBeGreaterThan(1400);
   expect(l.content).toContain("نشاط الدعم والعلاج");
   expect(l.content).toContain("تقويم ختامي");
   expect(l.learningObjectives.length).toBe(3);
   expect(l.learningObjectives.every(o=>o.startsWith("أن "))).toBe(true);
   expect(l.questions.map(q=>q.order)).toEqual([1,2,4,5]);
   expect(l.retainedQuestionOrders).toEqual([3]);
   expect(l.activities.map(a=>a.order)).toEqual([1,2,3]);
   expect(l.activities[2].type).toBe("writing");
   for(const q of l.questions){
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.question).not.toMatch(/ما المهارة الرئيسة|أي تطبيق يساعدك|ما الخطوة الأفضل|كيف تتحقق/u);
   }
  }
  expect(completed[0].content).toContain("سِتَّة");
  expect(completed[1].content).toContain("صَارَ");
 });
 it("keeps scoring keys, explanations and student attempts outside the public source",()=>{
  expect(pack.containsAnswerKeys).toBe(false);
  expect(raw).not.toMatch(/"correct_answer"\s*:|"correctAnswer"\s*:|"model_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:|"answer"\s*:/u);
 });
});