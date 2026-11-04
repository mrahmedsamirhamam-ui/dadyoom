/**
 * تدريب إملائي إثرائي أصلي لضاديوم.
 * لا يمثّل درسًا رسميًا ولا يستعمل الذكاء الاصطناعي أو يحفظ إجابات الأطفال.
 */
export type DictationLevel = "foundation" | "building" | "challenge";

export type DictationTask = {
  id: string;
  sentence: string;
  focus: string;
  hint: string;
  explanation: string;
};

export const DICTATION_LEVELS: Record<DictationLevel, { label: string; description: string }> = {
  foundation: { label: "التأسيس", description: "جمل قصيرة ومفردات مألوفة" },
  building: { label: "البناء", description: "مهارات التاء والهمزة والألف" },
  challenge: { label: "التحدي", description: "جمل أطول ومهارات إملائية مركبة" },
};

export const DICTATION_TASKS: Record<DictationLevel, readonly DictationTask[]> = {
  foundation: [
    {
      id: "read-book",
      sentence: "أقرأ كتابًا مفيدًا.",
      focus: "همزة القطع",
      hint: "انتبه إلى بداية الفعل في الجملة.",
      explanation: "تبدأ كلمة «أقرأ» بهمزة قطع مكتوبة فوق الألف (أ).",
    },
    {
      id: "school",
      sentence: "ذهبت إلى المدرسة.",
      focus: "التاء المربوطة",
      hint: "راجع آخر كلمة تدل على مكان التعلم.",
      explanation: "تنتهي كلمة «المدرسة» بتاء مربوطة (ة)، وليست هاءً (ه).",
    },
    {
      id: "water",
      sentence: "شربت ماءً باردًا.",
      focus: "الهمزة المتطرفة",
      hint: "راجع كتابة اسم الشراب.",
      explanation: "تكتب الهمزة في «ماء» على السطر بعد ألف المد، ولا تُحذف.",
    },
  ],
  building: [
    {
      id: "boy-garden",
      sentence: "وصل الفتى إلى الحديقة.",
      focus: "الألف المقصورة",
      hint: "انتبه إلى نهاية الاسم الذي يدل على الصبي.",
      explanation: "تنتهي كلمة «الفتى» بألف مقصورة (ى)، وليست ياءً منقوطة (ي).",
    },
    {
      id: "tree",
      sentence: "رأيت شجرة جميلة.",
      focus: "التاء المربوطة",
      hint: "راجع آخر كلمتين في الجملة.",
      explanation: "تنتهي «شجرة» و«جميلة» بتاء مربوطة (ة).",
    },
    {
      id: "question",
      sentence: "سأل سامر معلمه عن الدرس.",
      focus: "الهمزة المتوسطة",
      hint: "انتبه إلى الهمزة داخل الفعل الأول.",
      explanation: "تُكتب همزة «سأل» على الألف لأنها مفتوحة وما قبلها مفتوح.",
    },
  ],
  challenge: [
    {
      id: "creativity",
      sentence: "إن الإبداع يحتاج إلى المثابرة.",
      focus: "همزتا القطع والوصل",
      hint: "راجع الهمزات في الكلمات الأولى.",
      explanation: "«إن» و«الإبداع» و«إلى» فيها همزات قطع مكتوبة، و«المثابرة» تبدأ بأل التعريف.",
    },
    {
      id: "gift",
      sentence: "اشترى أخي هدية لأمي.",
      focus: "الألف المقصورة والهمزة",
      hint: "انتبه إلى آخر الفعل وأول الاسمين.",
      explanation: "تنتهي «اشترى» بألف مقصورة، وتُكتب الهمزة في «أخي» و«لأمي».",
    },
    {
      id: "initiative",
      sentence: "نشأت مبادرة لإحياء القراءة.",
      focus: "الهمزات",
      hint: "راجع الهمزات في الفعل والمصدر.",
      explanation: "تكتب الهمزة على الألف في «نشأت»، وتحت الألف في «لإحياء».",
    },
  ],
};

/**
 * يتسامح فحص التدريب مع التشكيل وعلامات الترقيم فقط.
 * لا يساوي بين (أ/إ/ا)، أو (ة/ه)، أو (ى/ي) لأن هذه فروق إملائية مهمة.
 */
export function normalizeDictation(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[\u064B-\u065F\u0670\u0640]/gu, "")
    .replace(/[،؛؟!.,:…«»"“”()]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export type DictationResult = {
  correct: boolean;
  differences: { position: number; expected: string; actual: string }[];
};

export function checkDictation(answer: string, sentence: string): DictationResult {
  const expected = normalizeDictation(sentence).split(" ").filter(Boolean);
  const actual = normalizeDictation(answer).split(" ").filter(Boolean);
  const differences: DictationResult["differences"] = [];
  for (let index = 0; index < Math.max(expected.length, actual.length); index += 1) {
    if (expected[index] !== actual[index]) {
      differences.push({
        position: index + 1,
        expected: expected[index] ?? "—",
        actual: actual[index] ?? "—",
      });
    }
  }
  return { correct: differences.length === 0, differences };
}
