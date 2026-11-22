import { describe, expect, it } from "vitest";
import { publicLessonActivities } from "../features/lesson-activities/services/public-lesson-activities";

const source = {
  id: "activity-123",
  lesson_id: "lesson-123",
  title: "أفهم المقطع",
  activity_type: "multiple_choice",
  instructions: "اقرأ النص ثم أجب",
  prompt: "كيف ساعد الطفل زميله؟",
  content: {
    originalText: "زار الطفل المكتبة واختار قصة قصيرة مع صديقه.",
    originalReference: "بطاقة ضاديوم لدعم القراءة والتعبير.",
    text: "قرأ المعلم فقرة الاستماع مرتين.",
    options: ["ساعده في القراءة", "منعه", "غادر"],
    answer: "ساعده في القراءة",
    answer_key: "ساعده في القراءة",
    nested: [{ isCorrect: true, correct_word: "خفي", option: "ساعده في القراءة" }],
    teacher: { correctAnswer: "سر", solution: { answer: "سر آخر" } },
  },
  answer: { correct: "ساعده في القراءة" },
  activity_order: 2,
  points: 5,
  is_published: true,
  section: "practice",
  created_at: "2026-10-30T00:00:00Z",
  updated_at: "2026-10-30T00:00:00Z",
};

describe("public lesson activity projection", () => {
  it("keeps visible question, reading text, learning context, choices and optional teacher-read passage", () => {
    const [activity] = publicLessonActivities([source]);
    expect(activity.prompt).toBe(source.prompt);
    expect(activity.content.originalText).toBe(source.content.originalText);
    expect(activity.content.originalReference).toBe(source.content.originalReference);
    expect(activity.content.text).toBe(source.content.text);
    expect(activity.content.options).toEqual(source.content.options);
    expect(activity.content.nested).toEqual([{ option: "ساعده في القراءة" }]);
  });
  it("removes private grading fields recursively and strips the answer column, including punctuation aliases", () => {
    const [activity] = publicLessonActivities([source]);
    expect("answer" in activity).toBe(false);
    expect("answer" in activity.content).toBe(false);
    expect("answer_key" in activity.content).toBe(false);
    expect("correctAnswer" in (activity.content.teacher as object)).toBe(false);
    expect("solution" in (activity.content.teacher as object)).toBe(false);
    expect(JSON.stringify(activity)).not.toContain("خفي");
    expect(JSON.stringify(activity)).not.toContain("سر آخر");
  });
  it("omits malformed responses rather than sending private or untrusted extra fields", () => {
    expect(publicLessonActivities([{id: 123}, null, undefined])).toEqual([]);
  });
});