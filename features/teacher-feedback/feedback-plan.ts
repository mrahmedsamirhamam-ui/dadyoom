/**
 * Evidence-based formative feedback drafts for teachers, inside and outside Dadyoom.
 * No account lookup, student identifiers, assessment writes or automatic grading.
 */
export const FEEDBACK_SKILLS = [
  {
    id: "reading-fluency",
    title: "القراءة الجهرية",
    practice: "قراءة نص جديد قصير مرتين مع تتبع الكلمات والوقف المناسب",
    criterion: "صحة الكلمات والوقف الملائم للمعنى",
    transfer: "قراءة فقرة جديدة لم يسبق التدريب عليها",
  },
  {
    id: "reading-comprehension",
    title: "الفهم القرائي",
    practice: "قراءة فقرة ثم تحديد فكرتها الرئيسة والاستدلال من النص",
    criterion: "الاستدلال على إجابة من النص وذكر شاهد",
    transfer: "تفسير فقرة جديدة بأسئلة مختلفة",
  },
  {
    id: "writing",
    title: "التعبير الكتابي",
    practice: "تخطيط فقرة وكتابتها ثم مراجعتها وفق قائمة تحقق",
    criterion: "وضوح الفكرة وترابط الجمل وصحة العلامات",
    transfer: "كتابة فقرة عن موقف جديد",
  },
  {
    id: "spelling",
    title: "الإملاء",
    practice: "تمييز الظاهرة الإملائية في كلمات ثم تطبيقها في جمل من الإنشاء",
    criterion: "صحة كتابة الكلمات المستهدفة في سياق جديد",
    transfer: "إملاء جمل جديدة دون الاستعانة بأمثلة التدريب",
  },
  {
    id: "grammar",
    title: "النحو والتراكيب",
    practice: "ملاحظة تراكيب صحيحة ثم تعليل القاعدة وتطبيقها",
    criterion: "تمييز التركيب واستعماله استعمالًا صحيحًا",
    transfer: "إنشاء جمل جديدة تتضمن التركيب المستهدف",
  },
  {
    id: "listening",
    title: "الاستماع",
    practice: "الاستماع إلى نص قصير ثم ترتيب أفكاره والرد على أسئلته",
    criterion: "استخراج الفكرة والتفاصيل المسموعة بدقة",
    transfer: "فهم تسجيل جديد بموضوع مختلف",
  },
  {
    id: "speaking",
    title: "التحدث والإلقاء",
    practice: "التعبير الشفهي عن صورة أو موقف مع تغذية راجعة عن الوضوح والترتيب",
    criterion: "وضوح الصوت وتسلسل الأفكار واستعمال مفردات مناسبة",
    transfer: "تقديم شرح شفهي لموقف جديد",
  },
  {
    id: "handwriting",
    title: "الخط",
    practice: "نمذجة الحروف ونسخ سطر قصير ثم كتابته دون مثال مباشر",
    criterion: "وضوح الحروف واتساق المسافات واتجاه الكتابة",
    transfer: "كتابة جمل جديدة بخط مقروء",
  },
  {
    id: "main-idea",
    title: "الفكرة الرئيسة والتفاصيل",
    practice: "ترتيب أفكار نص جديد في مخطط يميز الفكرة المحورية من الشواهد",
    criterion: "تمييز الفكرة المحورية وذكر تفاصيل تدعمها",
    transfer: "وضع عنوان مناسب وتبرير اختياره لنص جديد",
  },
  {
    id: "vocabulary",
    title: "المفردات في السياق",
    practice: "استنتاج معاني مفردات من السياق ثم توظيفها في جمل من إنشاء المتعلم",
    criterion: "تحديد المعنى المناسب دون الاعتماد على حفظ التعريف وحده",
    transfer: "تفسير كلمات جديدة في سياق مختلف",
  },
  {
    id: "discussion",
    title: "المناقشة والاستدلال",
    practice: "تنظيم حوار قصير تدعمه حجة وشاهد مع احترام تبادل الأدوار",
    criterion: "وضوح الرأي وارتباط الدليل به واحترام الرأي الآخر",
    transfer: "دفاع عن وجهة نظر في موضوع جديد بالأدلة",
  },
  {
    id: "creative-writing",
    title: "الكتابة الإبداعية",
    practice: "تطوير فكرة من صورة إلى مشهد ثم صياغة نص أصيل ومراجعته",
    criterion: "أصالة الفكرة وتماسك البناء وملاءمة اللغة",
    transfer: "إنتاج نهاية بديلة لقصة لم يتدرب عليها",
  },
  {
    id: "attention",
    title: "التركيز وإدارة الانتباه",
    practice: "تقسيم مهمة قصيرة إلى خطوات مرئية مع فواصل مناسبة واختيار وسائل دعم",
    criterion: "إكمال الخطوات المتفق عليها ضمن فرصة تعليمية ميسرة",
    transfer: "تطبيق تنظيم المهمة في نشاط آخر دون ربطه بأي تشخيص طبي",
  },
  {
    id: "homework",
    title: "إنجاز الواجبات والمهام",
    practice: "تجزئة تكليف واقعي وتحديد وقت للإنجاز وتقديم تغذية راجعة محددة",
    criterion: "إتمام عناصر المهمة بجودة مناسبة مع مراعاة ظروف المتعلم",
    transfer: "تنظيم مهمة جديدة باستخدام قائمة تحقق مستقلة",
  },
  {
    id: "collaboration",
    title: "التعاون واحترام الآخرين",
    practice: "توزيع أدوار مرنة في مهمة جماعية ثم تأمل طريقة الإصغاء والتعاون",
    criterion: "المشاركة الإيجابية والإصغاء وتبادل المسؤولية",
    transfer: "مساهمة متوازنة في فريق جديد",
  },
  {
    id: "organization",
    title: "التنظيم وإدارة الذات",
    practice: "تدريب المتعلم على خطة قصيرة وتنظيم مواده وفق قائمة مرئية",
    criterion: "اختيار خطوات العمل ومتابعتها بمساندة تتناقص تدريجيًا",
    transfer: "تنظيم نشاط مختلف ومراجعة خطة العمل ذاتيًا",
  },
  {
    id: "arabic-second-language",
    title: "العربية للناطقين بغيرها",
    practice: "توظيف مفردات عالية التواتر في موقف محادثة وظيفية مع نمذجة واختيار بدائل بصرية",
    criterion: "استخدام العبارات المناسبة للتواصل في موقف مألوف",
    transfer: "المشاركة في موقف تواصلي جديد دون ترديد نموذج محفوظ",
  },
  {
    id: "participation",
    title: "المشاركة والتعلم الذاتي",
    practice: "تكليف المتعلم بدور محدد في نشاط قصير مع تهيئة ودعم تدريجي",
    criterion: "المبادرة والمشاركة وفق فرصة واضحة متاحة له",
    transfer: "المشاركة في نشاط آخر دون التلقين السابق",
  },
] as const;

export type FeedbackSkillId = (typeof FEEDBACK_SKILLS)[number]["id"];
export type Stage = "1-3" | "4-6" | "7-9" | "10-12";

export type FeedbackInput = {
  skill: FeedbackSkillId;
  stage: Stage;
  evidence: string;
  correct?: number | null;
  total?: number | null;
  reviewDays: number;
};

export type FeedbackDraft = {
  ready: boolean;
  issue: string | null;
  skillTitle: string;
  observation: string;
  intervention: string;
  measurement: string;
  familyMessage: string;
  exportText: string;
};

function validCounts(correct: number | null | undefined, total: number | null | undefined) {
  return Number.isInteger(correct) &&
    Number.isInteger(total) &&
    Number(total) > 0 &&
    Number(total) <= 100 &&
    Number(correct) >= 0 &&
    Number(correct) <= Number(total);
}

export function buildFeedbackDraft(input: FeedbackInput): FeedbackDraft {
  const skill = FEEDBACK_SKILLS.find((item) => item.id === input.skill);
  if (!skill) {
    throw new Error("مهارة غير معروفة");
  }
  const evidence = (input.evidence ?? "").trim().slice(0, 600);
  const hasEvidence = evidence.length >= 12;
  const hasCounts = validCounts(input.correct, input.total);
  const days = Number.isInteger(input.reviewDays)
    ? Math.min(30, Math.max(1, input.reviewDays))
    : 14;
  const ready = hasEvidence || hasCounts;
  const fact = [
    hasEvidence ? evidence : "",
    hasCounts ? ("أصاب في " + input.correct + " من " + input.total + " فرص موثقة") : "",
  ].filter(Boolean).join("؛ ");

  const observation = ready
    ? "في مهارة " + skill.title + "، الشاهد المسجل: " + fact + ". هذه ملاحظة تكوينية للمراجعة من المعلم وليست حكمًا تشخيصيًا آليًا."
    : "لا تتوفر شواهد فردية كافية بعد. أضف وصف أداء محددًا أو نتيجة نشاط موثقة قبل إصدار ملاحظة.";
  const intervention = "خطوة التدريس: " + skill.practice + ". يُعدّل المعلم مقدار الدعم ومدته وفق صف المتعلم (" + input.stage + ").";
  const measurement = "مؤشر المتابعة: " + skill.criterion + " في 4 من 5 فرص جديدة، مع مهمة انتقال: " + skill.transfer + ". إعادة القياس خلال " + days + " يومًا.";
  const familyMessage = ready
    ? "نتابع مهارة " + skill.title + " من خلال تدريب قصير، وسنعيد تقييمها بشواهد جديدة خلال " + days + " يومًا. نرجو تشجيع التعلم دون تحويل التدريب إلى اختبار منزلي."
    : "سيجري المعلم ملاحظة أداء المتعلم أولًا لتحديد المهارة والخطوة المناسبة.";
  return {
    ready,
    issue: ready ? null : "لا تعتمد ملاحظة فردية بلا دليل على أداء المتعلم.",
    skillTitle: skill.title,
    observation,
    intervention,
    measurement,
    familyMessage,
    exportText: ready
      ? [observation, intervention, measurement, "رسالة لولي الأمر: " + familyMessage].join("\n\n")
      : "",
  };
}
