export type ArabicSkill = "reading" | "vocabulary" | "grammar" | "spelling";

export type LevelQuestion = {
  id: string;
  skill: ArabicSkill;
  difficulty: 1 | 2 | 3;
  prompt: string;
  passage?: string;
  options: readonly [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
};

export const SKILL_LABELS: Readonly<Record<ArabicSkill, string>> = {
  reading: "فهم المقروء",
  vocabulary: "المفردات",
  grammar: "التراكيب النحوية",
  spelling: "الإملاء",
};

// Original Dadyoom practice items, not quotations from an official curriculum.
// This is a low-stakes orientation tool, NOT an accredited placement assessment.
export const LEVEL_QUESTIONS: readonly LevelQuestion[] = [
  {
    id: "reading-1", skill: "reading", difficulty: 1,
    passage: "قرأ عمر قصة قصيرة قبل النوم، ثم أخبر أخته بما تعلّمه منها.",
    prompt: "متى قرأ عمر القصة؟",
    options: ["بعد المدرسة", "قبل النوم", "في الصباح", "وقت الغداء"],
    correctIndex: 1,
    explanation: "ورد في النص صراحة: «قبل النوم».",
  },
  {
    id: "vocabulary-1", skill: "vocabulary", difficulty: 1,
    prompt: "ما مرادف كلمة «سعيد»؟",
    options: ["حزين", "متعب", "فَرِح", "غاضب"],
    correctIndex: 2,
    explanation: "«فَرِح» قريب من معنى «سعيد».",
  },
  {
    id: "grammar-1", skill: "grammar", difficulty: 1,
    prompt: "ما الفاعل في جملة «كتبتْ مريمُ الدرسَ»؟",
    options: ["مريمُ", "الدرسَ", "كتبتْ", "الجملة"],
    correctIndex: 0,
    explanation: "مريمُ هي التي قامت بفعل الكتابة؛ لذلك هي الفاعل.",
  },
  {
    id: "spelling-1", skill: "spelling", difficulty: 1,
    prompt: "اختر الكتابة الإملائية الصحيحة.",
    options: ["مدرسا", "مدرسه", "مدرثة", "مدرسة"],
    correctIndex: 3,
    explanation: "تُكتب كلمة «مدرسة» بتاء مربوطة في آخرها.",
  },
  {
    id: "reading-2", skill: "reading", difficulty: 2,
    passage: "عادت سارة من المدرسة فرأت الغيوم، وكانت أرض الحديقة مبللة.",
    prompt: "ما الاستنتاج الأقرب من النص؟",
    options: ["ربما هطل المطر", "لم توجد غيوم", "الحديقة جافة", "كانت سارة في البحر"],
    correctIndex: 0,
    explanation: "اجتماع الغيوم والأرض المبللة يدعم احتمال سقوط المطر، دون جزم.",
  },
  {
    id: "vocabulary-2", skill: "vocabulary", difficulty: 2,
    prompt: "ما معنى «ازدهرت» في عبارة «ازدهرت الأشجار في الربيع»؟",
    options: ["ذَبُلت", "نمت وتفتّحت", "تكسّرت", "اختفت"],
    correctIndex: 1,
    explanation: "ازدهرت أي نمت وتفتّحت وأصبحت في حالة جيدة.",
  },
  {
    id: "grammar-2", skill: "grammar", difficulty: 2,
    prompt: "أي الكلمات الآتية فعل مضارع؟",
    options: ["قرأ", "كتاب", "اقرأ", "يقرأ"],
    correctIndex: 3,
    explanation: "«يقرأ» يدل على حدث يقع في الزمن الحاضر أو المستقبل.",
  },
  {
    id: "spelling-2", skill: "spelling", difficulty: 2,
    prompt: "اختر الاسم المكتوب بهمزة قطع صحيحة.",
    options: ["احمد", "أحمد", "ءحمد", "أحمدد"],
    correctIndex: 1,
    explanation: "اسم «أحمد» يبدأ بهمزة قطع فوق الألف.",
  },
  {
    id: "reading-3", skill: "reading", difficulty: 3,
    passage: "اقترح خالد أن ينظّف زملاؤه مكتبة المدرسة. تعاون الجميع وأعادوا الكتب إلى أماكنها، فأصبحت المكتبة منظّمة.",
    prompt: "ما الفكرة العامة الأنسب للنص؟",
    options: ["فوائد القراءة السريعة", "صعوبة ترتيب الكتب", "التعاون يحافظ على النظام", "شراء الكتب الجديدة"],
    correctIndex: 2,
    explanation: "يدور النص حول تعاون الطلاب لتنظيم المكتبة، لا حول القراءة أو شراء الكتب.",
  },
  {
    id: "vocabulary-3", skill: "vocabulary", difficulty: 3,
    prompt: "ما المقصود بقولنا «يتأنّى الطالب قبل الإجابة»؟",
    options: ["يتسرّع", "ينسى", "يغادر", "يتروّى"],
    correctIndex: 3,
    explanation: "«يتأنّى» تعني يتروّى ولا يتعجّل.",
  },
  {
    id: "grammar-3", skill: "grammar", difficulty: 3,
    prompt: "لماذا جُزم الفعل «يهملْ» في جملة «لم يهملْ الطالبُ واجبَه»؟",
    options: ["لأنه مسبوق بـ«لم»", "لأنه فعل ماضٍ", "لأنه اسم", "لأنه مسبوق بـ«سوف»"],
    correctIndex: 0,
    explanation: "«لم» حرف نفي وجزم وقلب؛ يجزم الفعل المضارع بعده.",
  },
  {
    id: "spelling-3", skill: "spelling", difficulty: 3,
    prompt: "اختر الكتابة الصحيحة للكلمة الدالة على عدم شمول حالة بالحكم.",
    options: ["إستثناء", "استثنأ", "استثناء", "استثناا"],
    correctIndex: 2,
    explanation: "«استثناء» تبدأ بهمزة وصل، وتنتهي بهمزة متطرفة على السطر بعد ألف.",
  },
];

export type SkillSummary = {
  skill: ArabicSkill;
  label: string;
  correct: number;
  total: number;
  percent: number;
};

export type LevelSummary = {
  answered: number;
  total: number;
  correct: number;
  percent: number;
  band: "foundation" | "developing" | "advancing";
  bandLabel: string;
  breakdown: SkillSummary[];
  focus: SkillSummary;
};

const SKILLS: readonly ArabicSkill[] = ["reading", "vocabulary", "grammar", "spelling"];

export function evaluateLevelCheck(
  answers: Readonly<Record<string, number | undefined>>
): LevelSummary {
  const answered = LEVEL_QUESTIONS.filter((item) => { const answer = answers[item.id]; return Number.isInteger(answer) && answer !== undefined && answer >= 0 && answer < 4; }).length;
  const correct = LEVEL_QUESTIONS.filter((item) => answers[item.id] === item.correctIndex).length;
  const percent = Math.round((correct / LEVEL_QUESTIONS.length) * 100);
  const breakdown = SKILLS.map((skill) => {
    const items = LEVEL_QUESTIONS.filter((item) => item.skill === skill);
    const skillCorrect = items.filter((item) => answers[item.id] === item.correctIndex).length;
    return {
      skill,
      label: SKILL_LABELS[skill],
      correct: skillCorrect,
      total: items.length,
      percent: Math.round((skillCorrect / items.length) * 100),
    };
  });
  const focus = breakdown.reduce((lowest, item) => item.percent < lowest.percent ? item : lowest);
  const band = correct <= 4 ? "foundation" : correct <= 8 ? "developing" : "advancing";
  const labels = {
    foundation: "بداية التأسيس",
    developing: "في طريق التقدّم",
    advancing: "مؤشرات تقدّم جيدة",
  } as const;
  return {
    answered, total: LEVEL_QUESTIONS.length, correct, percent,
    band, bandLabel: labels[band], breakdown, focus,
  };
}

export function getRecommendedPath(skill: ArabicSkill) {
  switch (skill) {
    case "reading": return { href: "/skills/reading/practice", label: "تدرّب على الفهم القرائي" };
    case "vocabulary": return { href: "/dictionary", label: "وسّع مفرداتك" };
    case "grammar": return { href: "/courses", label: "اختر درسًا مناسبًا في القواعد" };
    case "spelling": return { href: "/skills/writing/practice", label: "تدرّب على الإملاء والكتابة" };
  }
}
