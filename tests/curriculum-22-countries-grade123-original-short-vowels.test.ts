import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";

type Option={id:string;text:string};
type Lesson={
 id:string;code:string;country:string;grade:number;title:string;
 referenceLetter:string;referenceWord:string;context:string;
 content:string;summary:string;learningObjectives:string[];
 vocabulary:{word:string;meaning:string}[];
 questions:{order:number;question:string;options:Option[]}[];
 openInstructions:string;
};
const path="data/curriculum-drafts/arab22-grades1-3-short-vowels-66-original-lessons-20261028.json";
const raw=readFileSync(resolve(process.cwd(),path),"utf8");
const packet=JSON.parse(raw) as {countryCount:number;grades:number[];containsAnswerKeys:boolean;lessons:Lesson[]};
const lessons=packet.lessons;
const codes="AE BH DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");

describe("Original short-vowels learning sequence in 22 countries, Grades 1-3",()=>{
 it("preserves 66 unique lesson IDs, three grades in each of 22 countries",()=>{
  expect(packet.countryCount).toBe(22);
  expect(packet.grades).toEqual([1,2,3]);
  expect(lessons).toHaveLength(66);
  expect(new Set(lessons.map(l=>l.id)).size).toBe(66);
  expect([...new Set(lessons.map(l=>l.code))].sort()).toEqual([...codes].sort());
  for(const code of codes)expect(lessons.filter(l=>l.code===code).map(l=>l.grade).sort()).toEqual([1,2,3]);
 });

 it("has precisely written phonetic examples, differentiation and measurable objectives",()=>{
  for(const l of lessons){
   expect(l.title).toBe("الحركات القصيرة");
   expect(l.referenceLetter).toMatch(/^[\u0621-\u064a]$/u);
   const f=l.referenceLetter+"َ",k=l.referenceLetter+"ِ",d=l.referenceLetter+"ُ";
   expect(l.context).toContain(f);
   expect(l.context).toContain(k);
   expect(l.context).toContain(d);
   expect(l.content).toContain(l.context);
   expect(l.content).toContain(l.referenceWord);
   expect(l.content).toContain("نشاط الدعم:");
   expect(l.content).toContain("نشاط التطبيق:");
   expect(l.content).toContain("نشاط التحدي:");
   expect(l.content).toContain("لا تُنقل من كتب الوزارة");
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(o=>o.startsWith("أن "))).toBe(true);
   expect(l.vocabulary.map(v=>v.word)).toEqual(["الفتحة","الكسرة","الضمة"]);
   expect(l.vocabulary.every(v=>v.meaning.length>15)).toBe(true);
   if(l.grade===3){
    expect(l.content).toContain(l.referenceLetter+"َا");
    expect(l.questions.some(q=>q.question.includes("الفتحة القصيرة دون مد"))).toBe(true);
   }
  }
 });

 it("provides 330 correctly shaped, grade-appropriate questions with distinct options",()=>{
  let total=0;
  for(const l of lessons){
   expect(l.questions.map(q=>q.order)).toEqual([1,2,3,4,5]);
   expect(new Set(l.questions.map(q=>q.question)).size).toBe(5);
   for(const q of l.questions){
    total++;
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.question).not.toMatch(/ما المهارة الرئيسة التي يتدرب|كيف تتحقق من إتقان المهارة الأساسية|ما الخطوة الأفضل بعد فهم مثال درس|أي تطبيق يساعدك على إتقان درس/u);
   }
   if(l.grade<=2){
    for(let i=0;i<3;i++)expect(l.questions[i].options.some(o=>o.text===l.referenceLetter+["َ","ِ","ُ"][i])).toBe(true);
   }
  }
  expect(total).toBe(330);
 });

 it("excludes teacher keys and model answers from committed student material",()=>{
  expect(packet.containsAnswerKeys).toBe(false);
  expect(raw).not.toMatch(/"correctAnswer"\s*:|"correct_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:/);
  expect(raw).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|service_role/);
 });
});
