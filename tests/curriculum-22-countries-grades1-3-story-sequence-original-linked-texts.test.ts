import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";

type Quiz={order:number;question:string;options:{id:string;text:string}[]};
type Lesson={
 id:string;code:string;country:string;grade:number;title:string;
 linkedReadingLessonId:string;linkedReadingTitle:string;sourceStory:string;
 content:string;summary:string;learningObjectives:string[];
 vocabulary:{word:string;meaning:string}[];questions:Quiz[];openInstructions:string;
};
const file="data/curriculum-drafts/arab22-grades1-3-story-sequence-66-lessons-20261028.json";
const raw=readFileSync(resolve(process.cwd(),file),"utf8");
const packet=JSON.parse(raw) as {countryCount:number;grades:number[];containsAnswerKeys:boolean;lessons:Lesson[]};
const lessons=packet.lessons;
const codes="AE BH DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");
describe("Original grade 1-3 chronology lessons across all 22 Arab countries",()=>{
 it("contains 66 distinct existing lessons linked to 66 original reading lessons",()=>{
  expect(packet.countryCount).toBe(22);
  expect(packet.grades).toEqual([1,2,3]);
  expect(lessons).toHaveLength(66);
  expect(new Set(lessons.map(x=>x.id)).size).toBe(66);
  expect(new Set(lessons.map(x=>x.linkedReadingLessonId)).size).toBe(66);
  expect([...new Set(lessons.map(x=>x.code))].sort()).toEqual([...codes].sort());
  for(const code of codes){
   expect(lessons.filter(x=>x.code===code).map(x=>x.grade).sort()).toEqual([1,2,3]);
  }
 });
 it("has original lesson text, objectives, differentiated practice and meaningful vocabulary",()=>{
  for(const l of lessons){
   expect(l.title).toBe("ترتيب الأحداث");
   expect(l.sourceStory.length).toBeGreaterThan(75);
   expect(l.content).toContain(l.sourceStory);
   expect(l.content).toContain(l.linkedReadingLessonId);
   expect(l.content).toContain("نشاط الدعم:");
   expect(l.content).toContain("نشاط التطبيق:");
   expect(l.content).toContain("نشاط التحدي:");
   expect(l.content).toContain("ولا يتضمن نصًا وزاريًا منقولًا");
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(x=>x.startsWith("أن "))).toBe(true);
   expect(l.vocabulary.map(x=>x.word)).toEqual(["البداية","التسلسل","الخاتمة"]);
  }
 });
 it("has 330 chronological questions with valid distinct options and 3 ordered story events",()=>{
  let count=0;
  for(const l of lessons){
   expect(l.questions.map(q=>q.order)).toEqual([1,2,3,4,5]);
   expect(new Set(l.questions.map(q=>q.question)).size).toBe(5);
   expect(l.questions[0].question).toContain(l.linkedReadingTitle);
   expect(l.questions[2].question).toContain(l.linkedReadingTitle);
   expect(l.questions[3].question).toContain(l.linkedReadingTitle);
   expect(l.questions[3].options.every(o=>o.text.includes("البداية: ")&&o.text.includes(" | الوسط: ")&&o.text.includes(" | النهاية: "))).toBe(true);
   expect(l.questions[0].options.some(o=>l.sourceStory.includes(o.text))).toBe(true);
   expect(l.questions[1].options.some(o=>l.sourceStory.includes(o.text))).toBe(true);
   expect(l.questions[2].options.some(o=>l.sourceStory.includes(o.text))).toBe(true);
   for(const q of l.questions){
    count++;
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.question).not.toMatch(/ما المهارة الرئيسة التي يتدرب|كيف تتحقق من إتقان المهارة الأساسية|ما الخطوة الأفضل بعد فهم مثال درس|أي تطبيق يساعدك على إتقان درس/u);
   }
  }
  expect(count).toBe(330);
 });
 it("keeps grading keys and model answers out of public source JSON",()=>{
  expect(packet.containsAnswerKeys).toBe(false);
  expect(raw).not.toMatch(/"correctAnswer"\s*:|"correct_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:/);
 });
});
