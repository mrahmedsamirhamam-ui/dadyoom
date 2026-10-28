import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const load=(path: string)=>JSON.parse(readFileSync(resolve(process.cwd(),path),"utf8"));
const source=load("data/curriculum-sources/bh-g7-s1-2026-ministry-plan-index.json");
const packs=[
  load("data/curriculum-drafts/bh-g7-s1-original-definiteness-practice.json"),
  load("data/curriculum-drafts/bh-g7-s1-original-grammar-expansion.json"),
];
const lessons=packs.flatMap(x=>x.practices);
const answers=(lesson:{
  questions:Array<{options:Array<{id:string;text:string}>;correctAnswer:string}>
})=>lesson.questions.map(q=>q.options.find(x=>x.id===q.correctAnswer)?.text);

describe("Grade-7 six sourced original grammar lessons must remain unpublished",()=>{
  it("aligns six source titles, numbered weeks and official plan page locations without guessed book pages",()=>{
    expect(source.grammarTopics).toHaveLength(12);
    expect(lessons).toHaveLength(6);
    expect(lessons.map(x=>x.sourceOrder)).toEqual([1,2,3,4,5,6]);
    expect(lessons.map(x=>x.officialTopic))
      .toEqual(source.grammarTopics.slice(0,6).map((x:{title:string})=>x.title));
    expect(lessons.reduce((total,l)=>total+l.questions.length,0)).toBe(24);
    for(const [i,l] of lessons.entries()){
      expect(l.week).toBe(source.grammarTopics[i].week);
      expect(l.source.url).toBe(source.source.url);
      expect(l.source.planPdfPage).toBe(source.grammarTopics[i].planPdfPage);
      expect(l.source.textbookPageStart).toBeNull();
      expect(l.source.textbookPageEnd).toBeNull();
      expect(l.source.visualTableVerification).toBe("pending");
      expect(l.status).toBe("original_g7_grammar_teacher_review_pending");
      expect(l.publicationApproved).toBe(false);
    }
  });
  it("provides 24 individually explained graded exercises and differentiated original instruction",()=>{
    const keys={a:0,b:0,c:0};
    for(const lesson of lessons){
      expect(lesson.content.length).toBeGreaterThanOrEqual(1200);
      expect(lesson.examples).toHaveLength(3);
      expect(lesson.objectives).toHaveLength(4);
      expect(lesson.differentiation.support).toContain("بطاقات");
      expect(lesson.differentiation.extension).toMatch(/(?:تحليل|تبديل)/);
      expect(lesson.questions).toHaveLength(4);
      expect(lesson.questions.map((q:{cognitiveLevel:string})=>q.cognitiveLevel))
        .toEqual(["remember","understand","analyze","apply"]);
      for(const q of lesson.questions){
        expect(q.options.map((o:{id:string})=>o.id)).toEqual(["a","b","c"]);
        expect(new Set(q.options.map((o:{text:string})=>o.text)).size).toBe(3);
        expect(q.options.some((o:{id:string})=>o.id===q.correctAnswer)).toBe(true);
        expect(q.explanation.length).toBeGreaterThan(55);
        keys[q.correctAnswer as keyof typeof keys]++;
      }
    }
    expect(keys).toEqual({a:8,b:8,c:8});
  });
  it("guards the subtle meaning changes of vocatives, fixed nouns, and present-tense construction",()=>{
    expect(answers(lessons[3])).toContain("مبني على الضم في محل نصب");
    expect(answers(lessons[3])).toContain("يا طالبًا، استمع إلى النصيحة");
    expect(answers(lessons[4])).toContain("في محل رفع مبتدأ");
    expect(answers(lessons[4])).toContain("أكثرها مبني، والمثنى مثل هذان يُعرب");
    expect(answers(lessons[5])).toContain("حذف حرف العلة");
    expect(answers(lessons[5])).toContain("لاتصاله بنون النسوة");
  });
  it("ensures editorial approval is not silently inferred from source headings or passing tests",()=>{
    for(const pack of packs){
      expect(pack.rights).toEqual({
        contentOwner:"dadyoom", officialTextbookBodyVerified:false,
        publicationApproved:false,teacherReview:"pending"
      });
    }
    expect(source.review.publicationApproved).toBe(false);
    expect(source.source.visualTableVerification).toBe("pending");
  });
});
