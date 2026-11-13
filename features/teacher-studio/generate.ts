export type StudioInput = {
  title: string;
  grade: string;
  country: string;
  sourceText: string;
  objectiveOne: string;
  objectiveTwo: string;
  durationMinutes: number;
};
export type StudioStage = {
  label: string;
  minutes: number;
  activity: string;
  evidence: string;
};
export type StudioDraft = {
  heading: string;
  sourceStatus: "unverified-teacher-supplied";
  objectives: [string, string];
  stages: StudioStage[];
  assessments: string[];
  differentiation: string[];
  reviewChecklist: string[];
};
const clean = (text: string, max: number) => text.replace(/\s+/g, " ").trim().slice(0, max);

export function generateStudioDraft(input: StudioInput): StudioDraft {
  const title = clean(input.title, 120);
  const grade = clean(input.grade, 60);
  const country = clean(input.country, 60);
  const source = clean(input.sourceText, 5000);
  const first = clean(input.objectiveOne, 180);
  const second = clean(input.objectiveTwo, 180);
  const duration = input.durationMinutes;
  if (!title || !grade || !country || source.length < 80 || !first || !second) {
    throw new Error("أدخل العنوان والصف والدولة ونصًا من 80 حرفًا على الأقل وهدفين واضحين.");
  }
  if (!Number.isInteger(duration) || duration < 30 || duration > 90) {
    throw new Error("مدة الحصة يجب أن تكون بين 30 و90 دقيقة.");
  }
  if (first === second) throw new Error("يجب أن يكون الهدفان مختلفين.");

  // 55-minute baseline is 5/10/15/15/10. Final stage absorbs rounding.
  const minutes = [5, 10, 15, 15].map((part) => Math.floor(duration * part / 55));
  minutes.push(duration - minutes.reduce((total, number) => total + number, 0));

  return {
    heading: "مسودة تحضير: " + title + " — الصف " + grade + " — " + country,
    sourceStatus: "unverified-teacher-supplied",
    objectives: [first, second],
    stages: [
      { label: "تهيئة", minutes: minutes[0], activity: "طرح سؤال تمهيدي عن «" + title + "» وربط الإجابات بخبرات المتعلمين.", evidence: "إجابتان شفهِيّتان يلاحظهما المعلم." },
      { label: "عرض موجّه", minutes: minutes[1], activity: "قراءة النص الذي أدخله المعلم ومناقشة فكرته مع التركيز على الهدف الأول: " + first, evidence: "استجابة تستشهد بجملة من النص." },
      { label: "نشاط تعاوني", minutes: minutes[2], activity: "عمل ثنائي لاستخراج مثال من النص يخدم الهدف الثاني: " + second, evidence: "نتاج مكتوب قصير لكل ثنائي." },
      { label: "تطبيق فردي", minutes: minutes[3], activity: "تطبيق فردي على «" + title + "»، يحدّد المعلم مستواه النهائي وفق محتوى المصدر.", evidence: "عينة فردية قابلة للتصحيح." },
      { label: "تقويم ختامي", minutes: minutes[4], activity: "بطاقة خروج بسؤال لكل هدف وتغذية راجعة قبل مغادرة الحصة.", evidence: "إجابتان تُراجعان حسب معيار إتقان يحدده المعلم." }
    ],
    assessments: [
      "ما الفكرة الأساسية في النص؟ استشهد بعبارة داعمة.",
      "اذكر دليلًا أو مثالًا من النص يوضح الهدف الأول: " + first,
      "قدّم مثالًا أو تطبيقًا يوضح الهدف الثاني: " + second
    ],
    differentiation: [
      "الدعم: تقسيم النص إلى فقرات قصيرة مع توضيح المفردات الصعبة.",
      "المستوى المتوسط: عمل ثنائي مع بطاقة تُوضّح خطوات الإجابة.",
      "الإثراء: مطالبة المتعلم بتفسير اختياره وإضافة شاهد ثانٍ."
    ],
    reviewChecklist: [
      "لم يجرِ التحقق آليًا من حقوق النص أو مصدره الرسمي.",
      "لم يجرِ التحقق من مطابقة هذا المحتوى للمنهج في الدولة والصف المحددين.",
      "الأنشطة والأسئلة قوالب أولية عامة، وليست تحليلًا ذكيًا للنص.",
      "يتعين مراجعة الهدفين والتحقق من قابليتهما للقياس وصحة اللغة."
    ]
  };
}
export function studioDraftAsText(input: StudioInput, draft: StudioDraft): string {
  return [
    draft.heading, "مدة الحصة: " + input.durationMinutes + " دقيقة",
    "الهدف الأول: " + draft.objectives[0], "الهدف الثاني: " + draft.objectives[1],
    "\nمراحل الدرس:",
    ...draft.stages.map((stage) => stage.label + " (" + stage.minutes + " دقيقة): " + stage.activity + "\nدليل التعلم: " + stage.evidence),
    "\nأسئلة التقويم الأولية:", ...draft.assessments.map((question, i) => (i + 1) + ". " + question),
    "\nالتمايز:", ...draft.differentiation,
    "\nالمراجعة المطلوبة:", ...draft.reviewChecklist,
    "\nحالة المستند: مسودة غير معتمدة، أُنتجت بقواعد ثابتة دون ذكاء اصطناعي أو تحقق آلي من المنهج."
  ].join("\n");
}