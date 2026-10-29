import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Question = { order:number; question:string; options:Array<{id:string;text:string}> };
type Activity = { order:number; title:string; type:string; prompt:string; content:{origin:string;options?:string[];text?:string} };
type Lesson = { id:string; grade:number; countryCode:string; country:string; content:string;
  learningObjectives:string[]; vocabulary:Array<{word:string;meaning:string}>;
  instructions:string[]; questions:Question[]; retainedQuestionOrder:number; activities:Activity[] };
const filePath = "data/curriculum-drafts/arab21-grades123-sounds-letters-original-63-20261029.json";
const raw = readFileSync(resolve(process.cwd(),filePath),"utf8");
const pack = JSON.parse(raw) as {countries:number;containsAnswerKeys:boolean;protectedBahrainGrade1:string;lessons:Lesson[]};
const countries = "AE DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");
const generic = /ما المهارة الرئيسة|أي تطبيق يساعدك|ما الخطوة الأفضل بعد فهم|كيف تتحقق من إتقان/u;

describe("Dadyoom 21-country original Grade 1-3 sounds and letters", () => {
  it("keeps 63 existing lesson UUIDs, 21 countries and three grade levels", () => {
    expect(pack.countries).toBe(21);
    expect(pack.lessons).toHaveLength(63);
    expect(new Set(pack.lessons.map(x=>x.id)).size).toBe(63);
    expect([...new Set(pack.lessons.map(x=>x.countryCode))].sort()).toEqual([...countries].sort());
    for(const code of countries){
      expect(pack.lessons.filter(x=>x.countryCode===code).map(x=>x.grade).sort()).toEqual([1,2,3]);
    }
  });
  it("contains unique, grounded phonemic teaching texts and differentiated instruction", () => {
    expect(new Set(pack.lessons.map(x=>x.content)).size).toBe(63);
    for(const lesson of pack.lessons){
      expect(lesson.content.length).toBeGreaterThan(1500);
      expect(lesson.content).toContain(lesson.country);
      expect(lesson.content).toContain("نشاط الدعم والعلاج");
      expect(lesson.content).toContain("نشاط التحدي والإثراء");
      expect(lesson.content).toContain("تقويم ختامي");
      expect(lesson.learningObjectives).toHaveLength(3);
      expect(lesson.learningObjectives.every(x=>x.startsWith("أن "))).toBe(true);
      expect(lesson.vocabulary).toHaveLength(3);
      expect(lesson.instructions).toHaveLength(3);
      expect(lesson.content).toContain("لا يمثل نقلًا لصفحة وزارية");
    }
  });
  it("replaces four generic questions per lesson, preserving question order 3", () => {
    for(const lesson of pack.lessons){
      expect(lesson.retainedQuestionOrder).toBe(3);
      expect(lesson.questions.map(q=>q.order)).toEqual([1,2,4,5]);
      for(const q of lesson.questions){
        expect(q.question).not.toMatch(generic);
        expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
        expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
      }
    }
  });
  it("includes two scored choice tasks and one differentiated writing/reading task per lesson", () => {
    for(const lesson of pack.lessons){
      expect(lesson.activities.map(a=>a.order)).toEqual([1,2,3]);
      expect(lesson.activities.slice(0,2).every(a=>a.type==="multiple_choice"&&a.content.options?.length===3)).toBe(true);
      expect(lesson.activities[2].type).toBe(lesson.grade===1?"reading":"writing");
      expect(lesson.activities.every(a=>a.prompt.length>=22&&a.content.origin==="DADYOOM_ARAB21_SOUNDS_LETTERS_G123_ORIGINAL_20261029")).toBe(true);
      expect(lesson.activities.slice(0,2).every(a=>a.prompt.endsWith("؟"))).toBe(true);
    }
  });
  it("excludes the attempted Bahrain Grade 1 lesson and never releases private grading answers", () => {
    expect(pack.lessons.every(x=>x.countryCode!=="BH")).toBe(true);
    expect(pack.protectedBahrainGrade1).toContain("125");
    expect(pack.containsAnswerKeys).toBe(false);
    expect(raw).not.toMatch(/"correct_answer"\s*:|"correctAnswer"\s*:|"model_answer"\s*:|"modelAnswer"\s*:|"explanation"\s*:|"answer"\s*:/u);
    expect(raw).not.toMatch(/"student_id"\s*:|"selected_answer"\s*:/u);
  });
});
