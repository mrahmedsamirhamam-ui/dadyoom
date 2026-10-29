import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Question = {order: number; question: string; options: {id: string; text: string}[]};
type Lesson = {id: string; country: string; grade: number; title: string;
  content: string; summary: string; learningObjectives: string[];
  vocabulary: {word: string; meaning: string}[]; questions: Question[];
  openInstructions: string};
const file = "data/curriculum-drafts/bahrain-grade2-grade3-verbal-sentence-original-20261029.json";
const raw = readFileSync(resolve(process.cwd(), file), "utf8");
const packet = JSON.parse(raw) as {country: string; containsAnswerKeys: boolean; lessons: Lesson[]};

describe("Bahrain original grade-2/3 verbal sentence packets", () => {
 it("contains two existing grade-specific records and 10 fully specified questions", () => {
  expect(packet.country).toBe("BH");
  expect(packet.lessons).toHaveLength(2);
  expect(packet.lessons.map(l=>l.grade)).toEqual([2,3]);
  expect(new Set(packet.lessons.map(l=>l.id)).size).toBe(2);
  for(const l of packet.lessons){
   expect(l.country).toBe("BH");
   expect(l.title).toBe("الجملة الفعلية البسيطة");
   expect(l.content).toContain("تدريب أصلي من ضاديوم");
   expect(l.content).toContain("نشاط الدعم:");
   expect(l.content).toContain("نشاط التطبيق:");
   expect(l.content).toContain("نشاط التحدي:");
   expect(l.learningObjectives).toHaveLength(3);
   expect(l.learningObjectives.every(x=>x.startsWith("أن "))).toBe(true);
   expect(l.vocabulary).toHaveLength(3);
   expect(l.questions.map(q=>q.order)).toEqual([1,2,3,4,5]);
   for(const q of l.questions){
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.question).not.toMatch(/المهارة الرئيسة التي يتدرب|كيف تتحقق من إتقان المهارة|أي تطبيق يساعدك على إتقان درس/);
   }
  }
 });
 it("differentiates the grammatical goals by grade",()=>{
  expect(packet.lessons[0].content).toContain("قرأَ معتزٌّ قصةً");
  expect(packet.lessons[1].content).toContain("رسمَ مالكٌ نخلةً");
  expect(packet.lessons[1].content).toContain("يرسمُ مالكٌ نخلةً");
 });
 it("contains no private answer key or model response",()=>{
  expect(packet.containsAnswerKeys).toBe(false);
  expect(raw).not.toMatch(/"correctAnswer"\s*:|"modelAnswer"\s*:|"explanation"\s*:/);
  expect(raw).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
 });
});