import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
type Quiz={order:number;question:string;options:{id:string;text:string}[]};
type Lesson={id:string;code:string;country:string;grade:number;title:string;
 referenceLetter:string;sourceWord:string;examples:string[];content:string;
 learningObjectives:string[];vocabulary:{word:string;meaning:string}[];
 questions:Quiz[];openInstructions:string};
const path="data/curriculum-drafts/arab22-grades1-3-madd-letters-66-original-lessons-20261028.json";
const raw=readFileSync(resolve(process.cwd(),path),"utf8");
const packet=JSON.parse(raw) as {countryCount:number;grades:number[];answerKeysIncluded:boolean;lessons:Lesson[]};
const codes="AE BH DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");
describe("Original grade1-3 Arabic madd practice for 22 countries",()=>{
 it("covers 66 existing distinct country-grade lessons",()=>{
  expect(packet.countryCount).toBe(22);
  expect(packet.grades).toEqual([1,2,3]);
  expect(packet.lessons).toHaveLength(66);
  expect(new Set(packet.lessons.map(l=>l.id)).size).toBe(66);
  expect([...new Set(packet.lessons.map(l=>l.code))].sort()).toEqual([...codes].sort());
  for(const code of codes)expect(packet.lessons.filter(l=>l.code===code).map(l=>l.grade).sort()).toEqual([1,2,3]);
 });
 it("distinguishes short vowels and long sounds without misrepresenting phonetic examples as standalone words",()=>{
  for(const l of packet.lessons){
   expect(l.title).toBe("حروف المد");
   expect(l.referenceLetter).toMatch(/^[\u0621-\u064a]$/u);
   expect(l.examples).toEqual([l.referenceLetter+"َا",l.referenceLetter+"ُو",l.referenceLetter+"ِي"]);
   expect(l.content).toContain(l.examples[0]);
   expect(l.content).toContain(l.examples[1]);
   expect(l.content).toContain(l.examples[2]);
   expect(l.content).toContain("وليست كلها كلمات مستقلة");
   expect(l.content).toContain("نشاط الدعم:");
   expect(l.content).toContain("نشاط التطبيق:");
   expect(l.content).toContain("نشاط التحدي:");
   expect(l.content).toContain("ليست نقلًا من الكتاب الوزاري");
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(x=>x.startsWith("أن "))).toBe(true);
   expect(l.vocabulary.map(x=>x.word)).toEqual(["مد الألف","مد الواو","مد الياء"]);
  }
 });
 it("provides 330 grade-linked multiple-choice questions with distinct options",()=>{
  let count=0;
  for(const l of packet.lessons){
   expect(l.questions.map(q=>q.order)).toEqual([1,2,3,4,5]);
   expect(new Set(l.questions.map(q=>q.question)).size).toBe(5);
   for(const q of l.questions){
    count++;
    expect(q.options.map(x=>x.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(x=>x.text)).size).toBe(3);
    expect(q.question).not.toMatch(/ما المهارة الرئيسة التي يتدرب|كيف تتحقق من إتقان المهارة الأساسية|ما الخطوة الأفضل بعد فهم مثال درس|أي تطبيق يساعدك على إتقان درس/u);
   }
   if(l.grade===3)expect(l.questions[4].options.some(o=>o.text===l.referenceLetter+"َ")).toBe(true);
  }
  expect(count).toBe(330);
 });
 it("does not publish teacher model answers or grading keys with student content",()=>{
  expect(packet.answerKeysIncluded).toBe(false);
  expect(raw).not.toMatch(/"correctAnswer"\s*:|"correct_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:/);
  expect(raw).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|service_role/);
 });
});
