/**
 * Original Dadyoom educational practice packs for a six-level learning pyramid.
 * Independent enrichment samples, not a claim of official textbook matching.
 * Questions and answers are reviewed examples; creative work needs teacher review.
 */

export type LearningLevel = "discover" | "understand" | "apply" | "analyze" | "evaluate" | "create";

export type ChoiceTask = {
  kind: "choice";
  question: string;
  options: readonly [string, string, string];
  correctIndex: 0 | 1 | 2;
  hint: string;
  explanation: string;
};

export type CreativeTask = {
  kind: "creative";
  question: string;
  example: string;
  criteria: readonly [string, string, string];
  teacherNote: string;
};

export type PyramidStep = {
  level: LearningLevel;
  title: string;
  purpose: string;
  task: ChoiceTask | CreativeTask;
};

export type PyramidPack = {
  slug: string;
  title: string;
  stage: string;
  goal: string;
  intro: string;
  steps: readonly [
    PyramidStep, PyramidStep, PyramidStep,
    PyramidStep, PyramidStep, PyramidStep,
  ];
};

export const LEVELS: readonly {
  id: LearningLevel;
  title: string;
  icon: string;
  color: string;
}[] = [
  { id: "discover", title: "اكتشف", icon: "🔎", color: "#827054" },
  { id: "understand", title: "افهم", icon: "💡", color: "#8b6461" },
  { id: "apply", title: "طبّق", icon: "✍️", color: "#38596a" },
  { id: "analyze", title: "حلّل", icon: "🧩", color: "#3c7a89" },
  { id: "evaluate", title: "قوّم", icon: "⚖️", color: "#9d793d" },
  { id: "create", title: "أبدع", icon: "⭐", color: "#286953" },
] as const;

export const PYRAMID_PACKS: readonly PyramidPack[] = [
  {
    slug: "haal",
    title: "الحال",
    stage: "النحو والتعبير",
    goal: "تمييز الحال وصاحبه وتوظيفه في جملة عربية سليمة",
    intro: "عاد الطالبُ مسرورًا. كيف كانت حالته حين عاد؟",
    steps: [
      {
        level: "discover", title: "لاحظ الكلمة",
        purpose: "التعرّف إلى التعبير الذي يصف الهيئة",
        task: {
          kind: "choice",
          question: "في جملة «عاد الطالبُ مسرورًا»، أي كلمة تصف هيئة الطالب عند العودة؟",
          options: ["مسرورًا", "الطالبُ", "عاد"],
          correctIndex: 0,
          hint: "اسأل نفسك: كيف عاد الطالب؟",
          explanation: "«مسرورًا» تبين هيئة الطالب وقت عودته، فهي حال منصوبة.",
        },
      },
      {
        level: "understand", title: "افهم المعنى",
        purpose: "فهم وظيفة الحال في الجملة",
        task: {
          kind: "choice",
          question: "ما وظيفة الحال في الجملة العربية؟",
          options: ["تحديد وقت الحدث فقط", "بيان هيئة صاحب الحال عند وقوع الفعل", "تسمية مكان وقوع الفعل"],
          correctIndex: 1,
          hint: "تتعلق الحال بالهيئة، مثل: واقفًا، مسرورًا، نشيطًا.",
          explanation: "الحال وصفٌ منصوب يبيّن هيئة صاحبه وقت وقوع الفعل، في هذا المثال.",
        },
      },
      {
        level: "apply", title: "استخدم القاعدة",
        purpose: "اختيار الحال المضبوطة في سياق جديد",
        task: {
          kind: "choice",
          question: "أكمل: «دخل المعلمُ الفصلَ ____».",
          options: ["مبتسمٌ", "ابتسامةً", "مبتسمًا"],
          correctIndex: 2,
          hint: "نبحث عن وصفٍ منصوب يجيب عن: كيف دخل المعلم؟",
          explanation: "«مبتسمًا» حالٌ منصوبة، تصف هيئة المعلم حين دخل الفصل.",
        },
      },
      {
        level: "analyze", title: "ميّز العلاقات",
        purpose: "تحليل العلاقة بين الحال وصاحبها",
        task: {
          kind: "choice",
          question: "في «رجع المسافرُ متعبًا»، من صاحب الحال؟",
          options: ["متعبًا", "المسافرُ", "رجع"],
          correctIndex: 1,
          hint: "ابحث عن الشخص الذي وُصف بأنه متعب.",
          explanation: "«المسافرُ» هو صاحب الحال، و«متعبًا» تصف هيئته عند رجوعه.",
        },
      },
      {
        level: "evaluate", title: "صحّح الخطأ",
        purpose: "مراجعة سلامة ضبط الحال",
        task: {
          kind: "choice",
          question: "الجملة «وصلت الطالبةُ سعيدةٌ» لا تضبط الحال ضبطًا صحيحًا. اختر التصويب.",
          options: ["وصلت الطالبةُ سعيدةً", "وصلت الطالبةَ سعيدةٌ", "وصلت الطالبةُ سعيدٌ"],
          correctIndex: 0,
          hint: "الحال منصوبة، وصاحب الحال هنا مؤنث.",
          explanation: "الصواب «وصلت الطالبةُ سعيدةً»: «سعيدةً» حالٌ منصوبة.",
        },
      },
      {
        level: "create", title: "أنت المؤلف",
        purpose: "إنتاج جملة عربية جديدة من ابتكار المتعلم",
        task: {
          kind: "creative",
          question: "اكتب جملة فعلية من إنشائك تتضمن حالًا منصوبًا يصف شخصًا أو شيئًا.",
          example: "مثال للتوضيح: عاد الطفلُ فرحًا.",
          criteria: [
            "جملتي مفيدة وواضحة المعنى.",
            "ذكرتُ صاحب الحال وحالًا يصف هيئته.",
            "راجعتُ علامة نصب الحال في جملتي.",
          ],
          teacherNote: "هذا تقويم ذاتي للتدريب، وليس تصحيحًا آليًا للإجابة الحرة. يعرض المتعلم الجملة على معلمه للتحقق من صحة الأسلوب والضبط.",
        },
      },
    ],
  },
  {
    slug: "nominal-sentence",
    title: "المبتدأ والخبر",
    stage: "الجملة الاسمية",
    goal: "تحديد ركنَي الجملة الاسمية وإنشاء جملة سليمة",
    intro: "السماءُ صافيةٌ. ما الذي نتحدث عنه؟ وماذا أخبرنا عنه؟",
    steps: [
      {
        level: "discover", title: "اكتشف الركن الأول",
        purpose: "تعرّف المبتدأ في جملة قصيرة",
        task: {
          kind: "choice",
          question: "ما المبتدأ في جملة «السماءُ صافيةٌ»؟",
          options: ["صافيةٌ", "السماءُ", "السماءُ صافيةٌ"],
          correctIndex: 1,
          hint: "ابحث عن الاسم الذي بدأنا الحديث عنه.",
          explanation: "«السماءُ» مبتدأ مرفوع، نتحدث عنه في الجملة الاسمية.",
        },
      },
      {
        level: "understand", title: "افهم الركن الثاني",
        purpose: "التعرّف إلى الخبر ووظيفته",
        task: {
          kind: "choice",
          question: "ماذا تفيد كلمة «صافيةٌ» في «السماءُ صافيةٌ»؟",
          options: ["خبرًا يكمّل معنى الجملة", "فعلًا ماضيًا", "حرف جر"],
          correctIndex: 0,
          hint: "لو حذفناها، هل عرفنا صفة السماء؟",
          explanation: "«صافيةٌ» خبر مرفوع يبيّن لنا حال السماء ويتمم المعنى.",
        },
      },
      {
        level: "apply", title: "طبّق الضبط",
        purpose: "اختيار جملة اسمية صحيحة",
        task: {
          kind: "choice",
          question: "أي الجمل الآتية جملة اسمية مضبوطة ضبطًا صحيحًا؟",
          options: ["الكتابَ مفيدٌ", "الكتابُ مفيدًا", "الكتابُ مفيدٌ"],
          correctIndex: 2,
          hint: "المبتدأ والخبر مفردان مرفوعان هنا.",
          explanation: "«الكتابُ مفيدٌ»: مبتدأ مرفوع وخبر مرفوع.",
        },
      },
      {
        level: "analyze", title: "حلّل الجملة",
        purpose: "تحديد الخبر بعد قراءة جملة جديدة",
        task: {
          kind: "choice",
          question: "في «الحديقةُ جميلةٌ»، أين الخبر؟",
          options: ["جميلةٌ", "الحديقةُ", "الجملة كاملة"],
          correctIndex: 0,
          hint: "اسأل: ماذا قلنا عن الحديقة؟",
          explanation: "الخبر «جميلةٌ»، وهو الذي أتمّ المعنى مع «الحديقةُ».",
        },
      },
      {
        level: "evaluate", title: "قوّم التركيب",
        purpose: "التحقق من المطابقة والإعراب",
        task: {
          kind: "choice",
          question: "اختر الصياغة الصحيحة بدلًا من «القصةُ مفيدًا».",
          options: ["القصةُ مفيدٌ", "القصةُ مفيدةٌ", "القصةَ مفيدةٌ"],
          correctIndex: 1,
          hint: "«القصة» مؤنث، والخبر المفرد مرفوع هنا.",
          explanation: "«القصةُ مفيدةٌ»: تطابق في التأنيث، والمبتدأ والخبر مرفوعان.",
        },
      },
      {
        level: "create", title: "أبدع جملة",
        purpose: "توظيف المبتدأ والخبر في تعبير أصلي",
        task: {
          kind: "creative",
          question: "اكتب جملة اسمية من إنشائك عن شيء تحبه في مدرستك أو بيتك، مع ضبط المبتدأ والخبر.",
          example: "مثال للتوضيح: المكتبةُ واسعةٌ.",
          criteria: [
            "بدأتُ باسم مناسب ليكون مبتدأ.",
            "أضفتُ خبرًا واضحًا يتمّم المعنى.",
            "راجعتُ ضبط المبتدأ والخبر ومطابقتهما.",
          ],
          teacherNote: "المهمة كتابة إبداعية مع قائمة تحقق ذاتي، ولا تعتمد في درجة الطالب الرسمية دون مراجعة المعلم.",
        },
      },
    ],
  },
];

export function getPyramidPack(slug: string): PyramidPack | undefined {
  return PYRAMID_PACKS.find((pack) => pack.slug === slug);
}
