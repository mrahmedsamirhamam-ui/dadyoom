import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const packPath = "data/curriculum-drafts/arab21-grades123-word-syllables-original-63-20261029.json";
const bahrainPath = "data/curriculum-drafts/bahrain-grades123-syllables-three-more-activities-20261029.json";
const packRaw = readFileSync(resolve(process.cwd(), packPath), "utf8");
const bhRaw = readFileSync(resolve(process.cwd(), bahrainPath), "utf8");
type Activity = {
 order: number; title: string; type: string; prompt: string;
 content: { origin: string; options?: string[]; items?: Array<{ sentence: string; options: string[] }>; left?: string[]; right?: string[] };
};
type Lesson = {
 id: string; countryCode: string; country: string; grade: number;
 content: string; learningObjectives: string[];
 vocabulary: Array<{ word: string; meaning: string }>;
 questions: Array<{ order: number; question: string; options: Array<{ id: string; text: string }> }>;
 activities: Activity[];
};
const source = JSON.parse(packRaw) as {
 countryCount: number; gradeRange: number[]; hasAnswerKeys: boolean;
 counts: { lessons: number; replacedQuestions: number; replacedActivities: number; newActivities: number; finalActivitiesPerLesson: number };
 lessons: Lesson[];
};
const bahrain = JSON.parse(bhRaw) as {
 countryCode: string; activitiesAdded: number; totalActivitiesPerLesson: number; hasAnswerKeys: boolean;
 activities: Array<{ lessonId: string; grade: number; order: number; type: string; content: Record<string, unknown> }>;
};
const codeList = "AE DJ DZ EG IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" ");

describe("66 original Grade 1–3 syllable lessons across the 22 Arab countries", () => {
 it("covers 21 non-Bahrain countries with unique original Grade 1–3 texts and stable IDs", () => {
  expect(source.countryCount).toBe(21);
  expect(source.gradeRange).toEqual([1, 2, 3]);
  expect(source.counts).toEqual({ lessons: 63, replacedQuestions: 252, replacedActivities: 189, newActivities: 189, finalActivitiesPerLesson: 6 });
  expect(source.lessons).toHaveLength(63);
  expect(new Set(source.lessons.map(x => x.id)).size).toBe(63);
  expect(new Set(source.lessons.map(x => x.content)).size).toBe(63);
  expect([...new Set(source.lessons.map(x => x.countryCode))].sort()).toEqual([...codeList].sort());
  expect(source.lessons.every(x => x.countryCode !== "BH")).toBe(true);
  for (const code of codeList) {
   expect(source.lessons.filter(x => x.countryCode === code).map(x => x.grade).sort()).toEqual([1, 2, 3]);
  }
 });
 it("has 3 measurable goals, differentiates support and enrichment, and teaches authentic words", () => {
  for (const x of source.lessons) {
   expect(x.content.length).toBeGreaterThan(1550);
   expect(x.content).toContain(x.country);
   expect(x.content).toContain("نشاط الدعم والعلاج");
   expect(x.content).toContain("نشاط التحدي والإثراء");
   expect(x.content).toContain("التقويم الختامي");
   expect(x.learningObjectives).toHaveLength(3);
   expect(x.learningObjectives.every(g => g.startsWith("أن "))).toBe(true);
   expect(x.vocabulary).toHaveLength(3);
   if (x.grade === 3) expect(x.content).toContain("الشدة");
   if (x.grade === 2) expect(x.content).toContain("السكون");
   if (x.grade === 1) expect(x.content).toContain("الحركات");
  }
 });
 it("keeps a valid original Q3 while replacing four template questions with valid option sets", () => {
  for (const x of source.lessons) {
   expect(x.retainedQuestionOrder).toBe(3);
   expect(x.questions.map(q => q.order)).toEqual([1, 2, 4, 5]);
   for (const q of x.questions) {
    expect(q.question).not.toMatch(/ما المهارة الرئيسة|أي تطبيق يساعدك|ما الخطوة الأفضل بعد فهم|كيف تتحقق من إتقان/u);
    expect(q.options.map(o => o.id)).toEqual(["a", "b", "c"]);
    expect(new Set(q.options.map(o => o.text)).size).toBe(3);
   }
  }
 });
 it("produces six genuinely different tasks in each of the 63 lessons", () => {
  for (const x of source.lessons) {
   expect(x.activities.map(a => a.order)).toEqual([1, 2, 3, 4, 5, 6]);
   expect(x.activities.map(a => a.type)).toEqual(["multiple_choice","multiple_choice","writing","fill_blank","matching","reading"]);
   expect(x.activities[3].content.items?.[0]?.options).toHaveLength(3);
   expect(new Set(x.activities[3].content.items?.[0]?.options).size).toBe(3);
   expect(x.activities[4].content.left).toHaveLength(2);
   expect(x.activities[4].content.right).toHaveLength(2);
   expect(x.activities.every(a => a.prompt.length >= 45)).toBe(true);
   expect(x.activities.every(a => a.content.origin === "DADYOOM_ARAB21_SYLLABLES_G123_20261029")).toBe(true);
  }
 });
 it("adds three distinct activities to each Bahrain Grade1–3 lesson, without overwriting it", () => {
  expect(bahrain.countryCode).toBe("BH");
  expect(bahrain.activitiesAdded).toBe(9);
  expect(bahrain.totalActivitiesPerLesson).toBe(6);
  expect(bahrain.activities).toHaveLength(9);
  expect(new Set(bahrain.activities.map(a => a.lessonId)).size).toBe(3);
  for (const grade of [1,2,3]) {
   expect(bahrain.activities.filter(a => a.grade===grade).map(a => a.order)).toEqual([4, 5, 6]);
  }
  expect(bahrain.activities.map(a=>a.type).filter(a=>a==="fill_blank")).toHaveLength(3);
 });
 it("does not publish private answer keys, student IDs or real-ministry match claims", () => {
  expect(source.hasAnswerKeys).toBe(false);
  expect(bahrain.hasAnswerKeys).toBe(false);
  for (const raw of [packRaw, bhRaw]) {
   expect(raw).not.toMatch(/"correct_answer"\s*:|"model_answer"\s*:|"explanation"\s*:|"answer"\s*:|"student_id"\s*:/u);
  }
 });
});
