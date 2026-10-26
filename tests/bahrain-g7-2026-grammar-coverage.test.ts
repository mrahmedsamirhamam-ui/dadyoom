import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const load=(path:string)=>JSON.parse(readFileSync(resolve(process.cwd(),path),"utf8"));
const source=load("data/curriculum-sources/bh-g7-s1-2026-ministry-plan-index.json");
const files=[
"data/curriculum-drafts/bh-g7-s1-original-definiteness-practice.json",
"data/curriculum-drafts/bh-g7-s1-original-grammar-expansion.json",
"data/curriculum-drafts/bh-g7-s1-original-inflection-and-copulas.json",
];
const packs=files.map(load),lessons=packs.flatMap(p=>p.practices);
const answerTexts=(lesson:{
 questions:Array<{options:Array<{id:string;text:string}>;correctAnswer:string}>
})=>lesson.questions.map(q=>q.options.find(o=>o.id===q.correctAnswer)?.text);

describe("Bahrain Grade-7 2026-27 first-semester grammar original authored topic coverage",()=>{
it("covers every one of the twelve Grade-7 grammar source headings with 48 questions, without duplicates",()=>{
  expect(source.grammarTopics).toHaveLength(12);
  expect(lessons).toHaveLength(12);
  expect(lessons.map(x=>x.sourceOrder)).toEqual(Array.from({length:12},(_,i)=>i+1));
  expect(lessons.map(x=>x.officialTopic)).toEqual(source.grammarTopics.map((x:{title:string})=>x.title));
  expect(new Set(lessons.map(x=>x.officialTopic)).size).toBe(12);
  expect(lessons.reduce((sum,lesson)=>sum+lesson.questions.length,0)).toBe(48);
  for(const [i,lesson] of lessons.entries()){
    const plan=source.grammarTopics[i];
    expect(lesson.week).toBe(plan.week);
    expect(lesson.source.url).toBe(source.source.url);
    expect(lesson.source.planPdfPage).toBe(plan.planPdfPage);
    expect(lesson.source.textbookPageStart).toBeNull();
    expect(lesson.source.textbookPageEnd).toBeNull();
    expect(lesson.source.visualTableVerification).toBe("pending");
    expect(lesson.publicationApproved).toBe(false);
    expect(lesson.status).toBe("original_g7_grammar_teacher_review_pending");
  }
});
it("requires varied explained questions, concrete examples, differentiated exercises and balanced answer positions",()=>{
  const balance={a:0,b:0,c:0};
  for(const lesson of lessons){
    expect(lesson.content.length).toBeGreaterThanOrEqual(1200);
    expect(lesson.examples).toHaveLength(3);
    expect(lesson.objectives).toHaveLength(4);
    expect(lesson.questions).toHaveLength(4);
    expect(lesson.differentiation.support).toContain("بطاقات");
    expect(lesson.differentiation.extension).toMatch(/(?:تحليل|تبديل)/);
    expect(lesson.questions.map((q:{cognitiveLevel:string})=>q.cognitiveLevel))
      .toEqual(["remember","understand","analyze","apply"]);
    expect(new Set(lesson.questions.map((q:{question:string})=>q.question)).size).toBe(4);
    for(const q of lesson.questions){
      expect(q.options.map((o:{id:string})=>o.id)).toEqual(["a","b","c"]);
      expect(new Set(q.options.map((o:{text:string})=>o.text)).size).toBe(3);
      expect(q.options.some((o:{id:string})=>o.id===q.correctAnswer)).toBe(true);
      expect(q.explanation.length).toBeGreaterThan(55);
      balance[q.correctAnswer as keyof typeof balance]++;
    }
  }
  expect(balance).toEqual({a:16,b:16,c:16});
});
it("protects the case endings and opposite effects of كان and إن without reproducing official textbook passages",()=>{
  expect(answerTexts(lessons[6])).toContain("الألف");
  expect(answerTexts(lessons[6])).toContain("السكون");
  expect(answerTexts(lessons[7])).toContain("الواو");
  expect(answerTexts(lessons[7])).toContain("ناجحونَ");
  expect(answerTexts(lessons[8])).toContain("الكسرة نيابة عن الفتحة");
  expect(answerTexts(lessons[8])).toContain("أباكَ");
  expect(answerTexts(lessons[9])).toContain("جملة فعلية");
  expect(answerTexts(lessons[9])).toContain("شبه جملة جار ومجرور");
  expect(answerTexts(lessons[10])).toContain("ترفع الاسم وتنصب الخبر");
  expect(answerTexts(lessons[11])).toContain("خبر إن مرفوع");
  expect(answerTexts(lessons[11])).toContain("لعلَّ");
});
it("keeps all three files under explicit teacher signoff and publisher non-approval",()=>{
  for(const p of packs){
    expect(p.rights).toEqual({
      contentOwner:"dadyoom",officialTextbookBodyVerified:false,
      publicationApproved:false,teacherReview:"pending"
    });
    expect(p.academicYear).toBe("2026-2027");
    expect(p.grade).toBe(7);
  }
  expect(source.review.publicationApproved).toBe(false);
  expect(source.source.visualTableVerification).toBe("pending");
});
});
