import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildMissingCurriculumQuestions } from "../lib/curriculum-packs/import-questions.mjs";

const lesson = "11111111-1111-4111-8111-111111111111";
const q = (text: string, key = "a") => ({
  question:text,type:"multiple_choice",
  options:[{id:"a",text:"صحيح"},{id:"b",text:"غير صحيح"}],
  correctAnswer:key,explanation:"معلومة مفسرة",points:1,
});

describe("reviewed curriculum pack question preservation", () => {
  it("imports all six new questions, not just three", () => {
    const rows = buildMissingCurriculumQuestions(lesson,
      Array.from({length:6},(_,i) => q("السؤال "+(i+1))), []);
    expect(rows).toHaveLength(6);
    expect(rows.map((row: {question_order:number})=>row.question_order))
      .toEqual([1,2,3,4,5,6]);
    expect(rows.every((row: {correct_answer:string})=>row.correct_answer==="a")).toBe(true);
  });

  it("keeps existing attempt-linked questions intact and deduplicates incoming prompts", () => {
    const existing = [{id:"old-key-1",question:"السؤال 1",question_order:9}];
    const incoming = [q("السؤال 1"),q("السؤال 2","b"),q(" السؤال 2 "),q("السؤال 3")];
    const rows = buildMissingCurriculumQuestions(lesson,incoming,existing);
    expect(rows.map((row: {question:string})=>row.question)).toEqual(["السؤال 2","السؤال 3"]);
    expect(rows.map((row: {question_order:number})=>row.question_order)).toEqual([10,11]);
    expect(rows[0].correct_answer).toBe("b");
    expect(existing).toHaveLength(1);
  });

  it("caps excessively large packs and requires valid question text", () => {
    expect(() => buildMissingCurriculumQuestions(lesson,Array.from({length:41},(_,i)=>q("q"+i)),[]))
      .toThrow("CURRICULUM_QUESTIONS_INVALID");
    expect(() => buildMissingCurriculumQuestions(lesson,[q("")],[]))
      .toThrow("CURRICULUM_QUESTION_MISSING_TEXT");
  });

  it("the real importer calls question preservation instead of slicing to three", () => {
    const source = readFileSync(resolve(process.cwd(),"scripts/import-curriculum-pack.mjs"),"utf8");
    expect(source).toContain("buildMissingCurriculumQuestions(");
    expect(source).not.toContain(".slice(0, needed)");
  });
});
