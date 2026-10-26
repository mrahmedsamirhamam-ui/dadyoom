import {
  buildEvidenceDeck,
  type EvidenceDeck,
  type EvidenceSlide,
  type GroundedLesson,
} from "./evidence-slide-deck";

export type BloomLevel =
  | "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create" | "unclassified";

export type ObjectiveAudit = {
  objective: string;
  bloom: BloomLevel;
  strategy: string;
  measurable: boolean;
  singleAction: boolean;
  needsTeacherReview: boolean;
};

const BLOOM: ReadonlyArray<{
  level: BloomLevel;
  verbs: readonly string[];
  strategy: string;
}> = [
  { level: "remember", verbs: ["يعدد", "يسمي", "يذكر", "يحدد", "يتعرف", "يسرد"], strategy: "استرجاع نشط وبطاقات استجابة" },
  { level: "understand", verbs: ["يفسر", "يشرح", "يلخص", "يوضح", "يصف", "يستنتج"], strategy: "فكر–زاوج–شارك والتفسير بأمثلة" },
  { level: "apply", verbs: ["يطبق", "يستخدم", "يوظف", "يكتب", "ينفذ"], strategy: "النمذجة ثم الممارسة الموجهة والمستقلة" },
  { level: "analyze", verbs: ["يحلل", "يقارن", "يميز", "يصنف", "يستخرج", "يفرق"], strategy: "التعلم التعاوني وتحليل الشواهد والخريطة الذهنية" },
  { level: "evaluate", verbs: ["يقيم", "يبرر", "ينقد", "يحكم", "يدافع"], strategy: "نقاش قائم على الأدلة وتقويم الأقران" },
  { level: "create", verbs: ["يصمم", "يؤلف", "ينتج", "يبتكر", "ينشئ", "يصوغ"], strategy: "التعلم بالمشروعات وإنتاج عمل أصيل" },
];

const normalize = (value: string) =>
  value.normalize("NFKC").replace(/[\u064b-\u065f\u0670\u0640]/gu, "").trim();

const objectivesFrom = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string")
        .map((item) => item.trim()).filter(Boolean))].slice(0, 6)
    : [];

/**
 * Bloom classification is heuristic, not a certification of an objective.
 * A compound or non-observable objective must be edited by a teacher.
 */
export function auditLearningObjective(input: string): ObjectiveAudit {
  const objective = input.trim();
  const n = normalize(objective);
  const words = n.split(/\s+/u);
  const actionWords = words.map((word) => word.replace(/[،؛.]/gu, "").replace(/^و(?=[يت])/u, ""));
  const matches = actionWords.filter((word) => BLOOM.some(({verbs}) => verbs.includes(word)));
  const classified = BLOOM.find(({verbs}) => matches.some((word) => verbs.includes(word)));
  const measurable = Boolean(classified);
  const singleAction = matches.length === 1 &&
    !/\bثم\b/u.test(n) &&
    !/،/u.test(n);
  return {
    objective,
    bloom: classified?.level ?? "unclassified",
    strategy: classified?.strategy ?? "تحديد فعل أداء واحد قابل للملاحظة قبل اعتماد الاستراتيجية",
    measurable,
    singleAction,
    needsTeacherReview: !measurable || !singleAction || !/^أن\s/u.test(n),
  };
}

const bloomArabic: Record<BloomLevel, string> = {
  remember: "التذكر", understand: "الفهم", apply: "التطبيق", analyze: "التحليل",
  evaluate: "التقويم", create: "الإبداع", unclassified: "يحتاج إلى مراجعة",
};

function makeObjectiveCycle(audit: ObjectiveAudit, index: number): EvidenceSlide[] {
  const label = `الهدف ${index + 1}: ${audit.objective}`;
  const guidance = audit.needsTeacherReview
    ? "تنبيه للمعلم: تحقق من أن الهدف مفرد، قابل للقياس، ومناسب للمرحلة قبل اعتماده."
    : "الاستراتيجية اقتراح من ضاديوم، ويختار المعلم التطبيق الأنسب لسياق الدرس.";

  return [
    {
      kind: "objectives",
      title: `الهدف التعليمي ${index + 1}`,
      bullets: [
        audit.objective,
        `مستوى بلوم الاسترشادي: ${bloomArabic[audit.bloom]}`,
        `طريقة التعلم: ${audit.strategy}`,
        guidance,
      ],
    },
    {
      kind: "activity",
      title: `نشاط متدرج للهدف ${index + 1}`,
      question: `أثبت تحقق هذا الهدف مستندًا إلى معلومات الدرس: ${audit.objective}`,
      bullets: [
        "دعم: استعن بمثال معروض، ونفذ خطوة واحدة بمساعدة المعلم.",
        "مستوى أساسي: أنجز الأداء المطلوب بصورة مستقلة مستدلًا بما تعلمت.",
        "تحدٍّ: أضف مثالًا جديدًا وفسّر أو برّر اختيارك بالدليل.",
      ],
    },
    {
      kind: "review",
      title: `تقويم بنائي للهدف ${index + 1}`,
      bullets: [
        label,
        "دليل التعلم: إجابة أو أداء قابل للملاحظة والمراجعة وفق الهدف نفسه.",
        "تغذية راجعة: ما الذي أُتقن؟ وما الخطوة التالية للتحسين؟",
      ],
    },
  ];
}

function getWarmup(source: GroundedLesson): string {
  // A real excerpt is a better evidence-based stimulus than an invented
  // video, image, story or government-owned slide.
  const text = String(source.content ?? "").replace(/\s+/gu, " ").trim();
  const summary = String(source.summary ?? "").replace(/\s+/gu, " ").trim();
  return (text.length >= 50 ? text : summary).slice(0, 180);
}

/**
 * Teaching flow authored by Dadyoom; factual claims stay in GroundedLesson.
 * The prompts are invitations to learn, not alleged official curriculum text.
 * No image/video/Quranic quotation is invented when no rights-cleared source exists.
 */
export function buildDadyoomTeachingDeck(lesson: GroundedLesson): EvidenceDeck | null {
  const sourceDeck = buildEvidenceDeck(lesson);
  if (!sourceDeck) return null;
  const warmup = getWarmup(lesson);
  const objectives = objectivesFrom(lesson.learning_objectives).map(auditLearningObjective);
  const sourceSlides = sourceDeck.slides.filter((slide) => slide.kind !== "cover" && slide.kind !== "objectives");
  const slides: EvidenceSlide[] = [
    {
      kind: "concept",
      title: "ميثاقنا الصفي",
      bullets: [
        "نستمع باحترام ولا نقاطع الآخرين.",
        "نشارك بأدب، ويحق لكل طالب طلب المساعدة.",
        "نستدل من النص ونحترم اختلاف الإجابات المبررة.",
        "نحافظ على الوقت والأدوات ونتعاون على التعلم.",
      ],
    },
    {
      kind: "activity",
      title: "ألاحظ وأتساءل — استنتج عنوان الدرس",
      subtitle: "تهيئة وعصف ذهني من دليل فعلي في المحتوى",
      ...(warmup ? {callout: warmup} : {}),
      question: "ما الموضوع الذي توحي به العبارة؟ ما الدليل على توقعك؟",
      bullets: [
        "فكر فرديًا، ثم ناقش توقعك مع زميل، وشارك تفسيرك.",
        "يمكن للمعلم استبدال العبارة بصورة أو قصة أو فيديو مرخّص مناسب لموضوع الدرس.",
      ],
    },
    sourceDeck.slides[0],
  ];
  if (objectives.length) {
    slides.push({
      kind: "objectives",
      title: "رحلة أهدافنا",
      bullets: objectives.map((item) => item.objective).slice(0, 4),
    });
  }
  slides.push(...sourceSlides);
  slides.push({
    kind: "activity",
    title: "دقيقة حركة وتركيز",
    question: "توقف لحظة، غيّر وضعيتك بأمان ثم ناقش فكرة واحدة فهمتها.",
    bullets: ["بديل ميسّر: استراحة نظر أو تنفس هادئ أو مشاركة كتابية دون حركة."],
  });
  objectives.forEach((item, index) => slides.push(...makeObjectiveCycle(item, index)));
  slides.push(
    {
      kind: "activity",
      title: "أربط وأتأمل وأتعاون",
      question: "اربط فكرة مؤكدة من الدرس بموقف من الحياة أو بمادة دراسية أخرى، واستشهد بما ورد في الدرس.",
      bullets: [
        "قيمة إسلامية أو إنسانية: استخرج قيمة يدعمها محتوى الدرس إن وجدت؛ لا تنسب آية أو حديثًا بلا مصدر موثّق.",
        "مهارات القرن الحادي والعشرين: التفكير الناقد والتواصل والعمل الجماعي مع ذكر الدليل.",
        "يُترك الربط غير المناسب أو غير المدعوم خارج العرض النهائي بعد مراجعة المعلم.",
      ],
    },
    {
      kind: "review",
      title: "تذكرة الخروج — ماذا تعلمت؟",
      bullets: [
        "اذكر فكرة أساسية واحدة من هذا الدرس.",
        "طبّق هدفًا تعلمته على مثال من الدرس.",
        "اكتب سؤالًا أو نقطة تحتاج فيها إلى مساعدة.",
      ],
    },
  );
  return {title: sourceDeck.title, slides};
}
