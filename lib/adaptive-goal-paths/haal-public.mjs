/** Key-free client learning preferences and content; never import the scored question bank here. */
export const PATHS = Object.freeze(["start", "progress", "challenge"]);
export const PATH_LABELS = Object.freeze({
  start: "مسار البداية",
  progress: "مسار التقدم",
  challenge: "مسار التحدي",
});
export const HALL_GOAL = Object.freeze({
  id: "arabic-g7-grammar-haal-identify",
  topic: "الحال",
  grade: 7,
  objective: "سيستطيع الطالب تحديد الحال وصاحب الحال في جمل جديدة بدقة لا تقل عن 80%.",
  mastery: Object.freeze({ minimumCorrect: 4, questionsPerCheck: 5, spacedChecks: 3 }),
  disclaimer: "هذا نموذج تجريبي تعليمي، وليس حكمًا نهائيًا بإتقان الطالب أو اعتمادًا لمنهج دولة بعينها.",
});


export const PATH_CONTENT = Object.freeze({
  start: Object.freeze({
    heading: "أبني الفهم خطوة خطوة",
    intro: "الحال كلمة تصف هيئة شخص أو شيء وقت حدوث الفعل. نسأل: كيف؟",
    example: "عادَ المسافرُ مسرورًا.",
    explanation: "1. من الذي عاد؟ المسافرُ. 2. كيف عاد؟ مسرورًا. إذن «مسرورًا» الحال و«المسافر» صاحب الحال.",
    practice: "تأمل: دخلَ الطفلُ ضاحكًا. قل: من الذي دخل؟ وكيف دخل؟",
    glossary: "الحال: وصف الهيئة وقت الفعل. صاحب الحال: الذي تصفه الحال.",
    hints: ["اسأل: كيف حدث الفعل؟", "ابحث عن الكلمة التي تصف هيئة فاعل الفعل.", "في «دخل الطفل ضاحكًا» الحال «ضاحكًا» وصاحبها «الطفل»."],
    feedback: "أحسنت استخدام سؤال «كيف؟». راجع صاحب الحال قبل الانتقال.",
  }),
  progress: Object.freeze({
    heading: "أطبّق وأربط",
    intro: "الحال اسم منصوب يبيّن هيئة صاحبه وقت وقوع الفعل، وقد يكون صاحب الحال فاعلًا أو مفعولًا به.",
    example: "رأيتُ الطائرَ محلّقًا.",
    explanation: "الحال «محلّقًا»، وصاحب الحال «الطائرَ» رغم أنه مفعول به. لا تعتمد على موقع الكلمة وحده.",
    practice: "قارن بين «عاد الطالبُ مسرورًا» و«رأيتُ الطالبَ مسرورًا». ما الحال في الجملتين؟",
    glossary: "الهيئة: الحالة التي يكون عليها صاحب الحال.",
    hints: ["ميّز بين الحدث والهيئة.", "اسأل: من الذي كان على هذه الهيئة؟", "مثال نظير: «شاهدتُ القمرَ ساطعًا»؛ ساطعًا حال من القمر."],
    feedback: "اربط الحال بصاحبها من خلال المعنى، وليس ترتيب الكلمات فقط.",
  }),
  challenge: Object.freeze({
    heading: "أحلّل وأكتشف",
    intro: "اقرأ الجملة وحلل العلاقة بين الوصف وصاحبه قبل طلب الشرح.",
    example: "عادتِ المتطوعاتُ فَرِحاتٍ.",
    explanation: "الحال «فرحاتٍ» وهي جمع مؤنث سالم منصوب وعلامة نصبه الكسرة، وصاحب الحال «المتطوعاتُ». راجع العلامة الإعرابية عند الحاجة.",
    practice: "أنشئ جملة يكون صاحب الحال فيها مفعولًا به، وجملة ثانية يكون فيها فاعلًا. فسر الفرق.",
    glossary: "نصب جمع المؤنث السالم بالكسرة عوضًا عن الفتحة.",
    hints: ["تأمل صاحب الوصف في الجملة.", "تذكر أن صاحب الحال قد يكون فاعلًا أو مفعولًا به.", "مثال نظير: «رأيتُ الفتياتِ مسروراتٍ»؛ مسروراتٍ حال من الفتيات."],
    feedback: "الدقة لا تعني التعقيد: اربط تفسيرك بالدليل من الجملة.",
  }),
});


/** Response time is recorded only if locally available, and NEVER used alone. */
export function recommendPath({ correct = 0, total = 0, hintsUsed = 0, errorKinds = [], responseTimesMs = [] } = {}) {
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) return "start";
  const ratio = Math.max(0, Math.min(1, correct / total));
  const requestedHelp = Math.max(0, hintsUsed);
  const diverseErrors = new Set(Array.isArray(errorKinds) ? errorKinds : []).size;
  // Time is contextual diagnostic information, not a penalty for slower readers.
  void responseTimesMs;
  if (ratio === 1 && requestedHelp <= 1 && diverseErrors <= 1) return "challenge";
  if (ratio >= 0.75 && requestedHelp <= 2) return "progress";
  return "start";
}

/** The learner may override this recommendation at any time. */
export function suggestSupport({ path, consecutiveSuccess = 0, consecutiveStruggles = 0 } = {}) {
  if (!PATHS.includes(path)) return "start";
  const index = PATHS.indexOf(path);
  if (consecutiveStruggles >= 3) return PATHS[Math.max(0, index - 1)];
  if (consecutiveSuccess >= 2) return PATHS[Math.min(PATHS.length - 1, index + 1)];
  return path;
}

