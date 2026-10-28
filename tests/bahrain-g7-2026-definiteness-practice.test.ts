import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(),path),"utf8"));
const source = read("data/curriculum-sources/bh-g7-s1-2026-ministry-plan-index.json");
const pack = read("data/curriculum-drafts/bh-g7-s1-original-definiteness-practice.json");

describe("Bahrain Grade7 original definite/indefinite grammar lessons", () => {
  it("matches the first three Ministry source headings but not unverified textbook page ranges", () => {
    expect(pack.schemaVersion).toBe(1);
    expect(pack.countryCode).toBe("BH");
    expect(pack.grade).toBe(7);
    expect(pack.semester).toBe(1);
    expect(pack.academicYear).toBe("2026-2027");
    expect(pack.practices).toHaveLength(3);
    for (const [i, lesson] of pack.practices.entries()) {
      const original = source.grammarTopics[i];
      expect(lesson.officialTopic).toBe(original.title);
      expect(lesson.sourceOrder).toBe(i+1);
      expect(lesson.week).toBe(original.week);
      expect(lesson.source.url).toBe(source.source.url);
      expect(lesson.source.planPdfPage).toBe(original.planPdfPage);
      expect(lesson.source.textbookPageStart).toBeNull();
      expect(lesson.source.textbookPageEnd).toBeNull();
      expect(lesson.source.visualTableVerification).toBe("pending");
      expect(lesson.publicationApproved).toBe(false);
      expect(lesson.status).toBe("original_g7_grammar_teacher_review_pending");
    }
    expect(pack.rights).toEqual({
      contentOwner:"dadyoom",officialTextbookBodyVerified:false,
      publicationApproved:false,teacherReview:"pending",
    });
  });

  it("has three distinct original explanations with twelve reasoned graded questions", () => {
    const balance = {a:0,b:0,c:0};
    const content = new Set<string>();
    for(const lesson of pack.practices) {
      expect(lesson.content.length).toBeGreaterThanOrEqual(1200);
      expect(lesson.content).toContain("محتوى ضاديوم الأصلي");
      expect(lesson.content).toContain("التقييم المتمايز");
      expect(lesson.content).not.toContain("يتناول هذا الدرس موضوع");
      expect(lesson.examples).toHaveLength(3);
      expect(lesson.objectives).toHaveLength(4);
      expect(lesson.differentiation.support).toContain("بطاقات");
      expect(lesson.differentiation.extension).toContain("تحليل");
      expect(lesson.questions).toHaveLength(4);
      expect(lesson.questions.map((q:{cognitiveLevel:string})=>q.cognitiveLevel))
        .toEqual(["remember","understand","analyze","apply"]);
      expect(new Set(lesson.questions.map((q:{question:string})=>q.question)).size).toBe(4);
      for (const question of lesson.questions) {
        expect(question.options.map((o:{id:string})=>o.id)).toEqual(["a","b","c"]);
        expect(new Set(question.options.map((o:{text:string})=>o.text)).size).toBe(3);
        expect(question.options.some((o:{id:string})=>o.id===question.correctAnswer)).toBe(true);
        expect(question.explanation.length).toBeGreaterThanOrEqual(60);
        balance[question.correctAnswer as keyof typeof balance]++;
      }
      content.add(lesson.content);
    }
    expect(content.size).toBe(3);
    expect(balance).toEqual({a:4,b:4,c:4});
  });

  it("protects meanings of معرفة, نكرة and الضمير from common category mistakes", () => {
    const correctText = (l: typeof pack.practices[0]) => l.questions.map((q:{
      options:Array<{id:string;text:string}>;correctAnswer:string
    })=>q.options.find((option:{id:string})=>option.id===q.correctAnswer)?.text);
    expect(correctText(pack.practices[0])).toContain("قصةً");
    expect(correctText(pack.practices[0])).toContain("لأنه اسم علم يدل على معيّن");
    expect(correctText(pack.practices[1])).toContain("أنا");
    expect(correctText(pack.practices[1])).toContain("قلمُنا");
    expect(correctText(pack.practices[2])).toContain("اسم إشارة");
    expect(correctText(pack.practices[2])).toContain("البحرين");
  });
});
