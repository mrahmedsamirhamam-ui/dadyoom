/**
 * An original, public, no-signup micro-lesson.
 * It is not presented as an official curriculum lesson and stores no child data.
 */
export type GuestQuestion = {
  id: "word" | "sentence";
  prompt: string;
  explanation: string;
  options: readonly string[];
  answer: string;
};

export const guestQuestions: readonly GuestQuestion[] = [
  {
    id: "word",
    prompt: "ما الكلمة التي تدل على شيء نقرؤه؟",
    options: ["كتاب", "يركض", "سريع"],
    answer: "كتاب",
    explanation: "الكتاب شيء نقرؤه، أما «يركض» فهو فعل، و«سريع» صفة.",
  },
  {
    id: "sentence",
    prompt: "أي جملة تبدأ بفعل؟",
    options: ["المدرسة جميلة", "يقرأ سالم قصة", "هذا القلم جديد"],
    answer: "يقرأ سالم قصة",
    explanation: "بدأت الجملة بفعل «يقرأ»، ولهذا نسميها جملة فعلية.",
  },
];

function normalizeAnswer(answer: string): string {
  return answer
    .replace(/[\u064B-\u065F\u0670]/gu, "")
    .replace(/ـ/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

export function assessGuestAnswer(question: GuestQuestion, choice: string): boolean {
  return normalizeAnswer(question.answer) === normalizeAnswer(choice);
}
