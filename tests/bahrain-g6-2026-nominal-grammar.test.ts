import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read=(path: string)=>JSON.parse(readFileSync(resolve(process.cwd(),path),"utf8"));
const pack=read("data/curriculum-drafts/bh-g6-s1-original-nominal-grammar-practice.json");
const ministry=read("data/curriculum-sources/bh-g6-s1-2026-ministry-plan-index.json");
const answerTexts=(x:{questions:Array<{correctAnswer:string;options:Array<{id:string;text:string}>}>})=>
  x.questions.map(q=>q.options.find(o=>o.id===q.correctAnswer)?.text);

describe("Bahrain Grade 6 syntax and nominal forms source-matched original teaching",()=>{
  it("has four source-topic-matched drafts, not ministerial book reproductions or publications",()=>{
    expect(pack.countryCode).toBe("BH");
    expect(pack.grade).toBe(6);
    expect(pack.semester).toBe(1);
    expect(pack.academicYear).toBe("2026-2027");
    expect(pack.practices).toHaveLength(4);
    expect(pack.rights).toEqual({
      contentOwner:"dadyoom", officialTextbookBodyVerified:false,
      publicationApproved:false,teacherReview:"pending",
    });
    for(const [i,item] of pack.practices.entries()){
      const orig=ministry.grammarTopics[i+9];
      expect(item.officialTopic).toBe(orig.title);
      expect(item.topicOrder).toBe(i+10);
      expect(item.source.url).toBe(ministry.source.url);
      expect(item.source.textbookPageStart).toBe(orig.textbookPageStart);
      expect(item.source.textbookPageEnd).toBe(orig.textbookPageEnd);
      expect(item.source.planPdfPage).toBe(orig.planPdfPage);
      expect(item.publicationApproved).toBe(false);
    }
  });
  it("contains explicit rule distinctions and 16 unambiguous balanced graded questions",()=>{
    const keys={a:0,b:0,c:0};
    for(const item of pack.practices){
      expect(item.content.length).toBeGreaterThanOrEqual(1000);
      expect(item.content).toContain("شرح أصيل من ضاديوم");
      expect(item.content).toContain("فروق فردية");
      expect(item.content).not.toContain("يتناول هذا الدرس موضوع");
      expect(item.examples).toHaveLength(3);
      expect(item.objectives).toHaveLength(4);
      expect(item.differentiation.support).toContain("بطاقات");
      expect(item.questions).toHaveLength(4);
      expect(item.questions.map((q:{cognitiveLevel:string})=>q.cognitiveLevel))
        .toEqual(["remember","understand","analyze","apply"]);
      for(const q of item.questions){
        expect(q.options.map((o:{id:string})=>o.id)).toEqual(["a","b","c"]);
        expect(new Set(q.options.map((o:{text:string})=>o.text)).size).toBe(3);
        expect(q.options.some((o:{id:string})=>o.id===q.correctAnswer)).toBe(true);
        expect(q.explanation.length).toBeGreaterThan(65);
        keys[q.correctAnswer as keyof typeof keys]++;
      }
    }
    expect(keys).toEqual({a:6,b:5,c:5});
  });
  it("checks teacher-facing grammar truth conditions across the four topics",()=>{
    expect(answerTexts(pack.practices[0])).toContain("نجحَ الطلابُ");
    expect(answerTexts(pack.practices[0])).toContain("الطالبانِ حضرا");
    expect(answerTexts(pack.practices[1])).toContain("البابُ");
    expect(answerTexts(pack.practices[1])).toContain("نائب فاعل مرفوع بالواو");
    expect(answerTexts(pack.practices[2])).toContain("الألف");
    expect(answerTexts(pack.practices[2])).toContain("اسم مجرور بالياء لأنه مثنى");
    expect(answerTexts(pack.practices[3])).toContain("الكسرة نيابة عن الفتحة");
    expect(answerTexts(pack.practices[3])).toContain("جمع تكسير");
  });
});
