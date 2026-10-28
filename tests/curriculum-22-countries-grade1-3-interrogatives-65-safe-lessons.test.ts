import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
const source="data/curriculum-drafts/arab22-grades1-3-interrogative-tools-65-safe-lessons-20261028.json";
const raw=readFileSync(resolve(process.cwd(),source),"utf8");
type Q={order:number;question:string;options:{id:string;text:string}[]};
type Lesson={id:string;code:string;country:string;grade:number;title:string;actor:string;
 linkedReadingLessonId:string;linkedReadingTitle:string;sourceStory:string;content:string;
 learningObjectives:string[];vocabulary:{word:string;meaning:string}[];questions:Q[];openInstructions:string;};
const data=JSON.parse(raw) as {
 countries:number;gradeCount:number;recordsTargeted:number;containsGradingKeys:boolean;
 excludedUsedLessons:{code:string;grade:number;id:string;progress:number;attempts:number}[];
 lessons:Lesson[];
};
const codes="AE BH DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");
describe("Grade-1/2/3 original story-linked interrogatives across 22 Arab countries",()=>{
 it("updates exactly 65 unattempted lessons and excludes learner-used Egypt Grade 1",()=>{
  expect(data.countries).toBe(22);
  expect(data.gradeCount).toBe(3);
  expect(data.recordsTargeted).toBe(65);
  expect(data.lessons).toHaveLength(65);
  expect(data.excludedUsedLessons).toHaveLength(1);
  expect(data.excludedUsedLessons[0]).toMatchObject({
   code:"EG",grade:1,id:"c9a144a1-4e34-42aa-89fd-5bf62418372d",progress:1,attempts:1
  });
  expect(new Set(data.lessons.map(l=>l.id)).size).toBe(65);
  expect(data.lessons.some(l=>l.id==="c9a144a1-4e34-42aa-89fd-5bf62418372d")).toBe(false);
  expect([...new Set(data.lessons.map(l=>l.code))].sort()).toEqual([...codes].sort());
  for(const code of codes){
   expect(data.lessons.filter(l=>l.code===code).map(l=>l.grade).sort())
    .toEqual(code==="EG"?[2,3]:[1,2,3]);
  }
 });
 it("grounds each lesson in the exact original reading passage and uses Bloom-aligned practice",()=>{
  for(const l of data.lessons){
   expect(l.title).toBe("أدوات الاستفهام");
   expect(l.sourceStory).toContain(l.actor);
   expect(l.content).toContain(l.sourceStory);
   expect(l.content).toContain(l.linkedReadingLessonId);
   expect(l.content).toContain("نشاط الدعم:");
   expect(l.content).toContain("نشاط التطبيق:");
   expect(l.content).toContain("نشاط التحدي:");
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(o=>o.startsWith("أن "))).toBe(true);
   expect(l.vocabulary).toHaveLength(3);
  }
 });
 it("has 325 non-generic questions with valid choice structure and rising tool difficulty",()=>{
  let n=0;
  for(const l of data.lessons){
   expect(l.questions).toHaveLength(5);
   expect(l.questions.map(q=>q.order)).toEqual([1,2,3,4,5]);
   for(const q of l.questions){
    n++;
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.question).not.toMatch(/ما المهارة الرئيسة التي يتدرب|كيف تتحقق من إتقان المهارة الأساسية|ما الخطوة الأفضل بعد فهم مثال درس|أي تطبيق يساعدك على إتقان درس/u);
   }
   if(l.grade===1) expect(l.questions[0].question).toContain("اسم شخصية");
   if(l.grade===2) expect(l.questions[1].question).toContain("طريقة التصرف");
   if(l.grade===3) expect(l.questions[2].question).toContain("يفسر السبب");
  }
  expect(n).toBe(325);
 });
 it("does not export answer keys or grading examples in public GitHub lesson data",()=>{
  expect(data.containsGradingKeys).toBe(false);
  expect(raw).not.toMatch(/"correctAnswer"\s*:|"correct_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:/);
 });
});
