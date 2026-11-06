/**
 * Original public micro-lesson, not an accredited textbook lesson.
 * All answers are browser-local; no learner identity or outcome is stored.
 */
export type GuestQuestion = {
  id: "word" | "sentence" | "check";
  phase: "practice" | "check";
  prompt: string;
  explanation: string;
  options: readonly string[];
  answer: string;
};

export const guestLesson = {
  objective: "أن يميّز المتعلم الفعل في كلمة وجملة قصيرة.",
  prerequisite: "القدرة على قراءة كلمات وجمل عربية قصيرة.",
  explanation: "الفعل كلمة تدل على حدث مرتبط بزمن، مثل «كتب» أو «يقرأ». والاسم يدل على إنسان أو شيء أو مكان، مثل «طالب» و«كتاب».",
  workedExample: "«كتبَ هاني رسالةً» جملة فعلية؛ لأنها بدأت بالفعل «كتبَ». أما «الرسالة جميلة» فتبدأ باسم.",
  review: "للمراجعة: ابحث عن الكلمة الأولى في الجملة، واسأل: هل تدل على فعل يحدث؟",
} as const;

export const guestQuestions: readonly GuestQuestion[] = [
  {
    id: "word",
    phase: "practice",
    prompt: "أي كلمة تدل على فعل؟",
    options: ["كتاب", "يركض", "سريع"],
    answer: "يركض",
    explanation: "«يركض» فعل يدل على حركة تحدث الآن، أما «كتاب» فاسم يدل على شيء و«سريع» وصف.",
  },
  {
    id: "sentence",
    phase: "practice",
    prompt: "أي جملة تبدأ بفعل؟",
    options: ["المدرسة جميلة", "يقرأ سالم قصة", "هذا القلم جديد"],
    answer: "يقرأ سالم قصة",
    explanation: "«يقرأ» فعل في بداية الجملة؛ لذلك «يقرأ سالم قصة» جملة فعلية. الجملتان الأخريان تبدآن باسم.",
  },
  {
    id: "check",
    phase: "check",
    prompt: "تحقق جديد: أي جملة تبدأ بفعل؟",
    options: ["القصة جميلة", "يكتب مازن رسالة", "هذا كتاب ممتع"],
    answer: "يكتب مازن رسالة",
    explanation: "«يكتب» فعل يدل على حدث، وقد بدأ الجملة؛ لذلك «يكتب مازن رسالة» جملة فعلية، لا جملة اسمية.",
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
  return question.options.some((option) => normalizeAnswer(option) === normalizeAnswer(choice))
    && normalizeAnswer(question.answer) === normalizeAnswer(choice);
}
