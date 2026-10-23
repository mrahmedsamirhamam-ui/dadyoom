/**
 * نموذج إثرائي تعليمي أصلي مستلهم من العرض الشائع ذي المستويات الخمسة لماسلو.
 * ليس مقياساً نفسياً، ولا يُستخدم لفرز الطلاب أو التشخيص أو استنتاج أوضاعهم.
 * لا تربط هذا المختبر بتقدم الطالب أو درجاته أو أي جداول بيانات شخصية.
 */

export type NeedId = "physiological" | "safety" | "belonging" | "esteem" | "self-actualization";

export type NeedLevel = {
  id: NeedId;
  label: string;
  icon: string;
  colorClass: string;
  widthClass: string;
  summary: string;
  examples: readonly string[];
  learningContext: string;
  teacherAction: string;
  writingPrompt: string;
};

export const MASLOW_LEVELS: readonly NeedLevel[] = [
  {
    id: "self-actualization",
    label: "تحقيق الذات",
    icon: "🌱",
    colorClass: "bg-amber-200 text-amber-950 border-amber-400",
    widthClass: "md:w-[48%]",
    summary: "تنمية الإمكانات والإبداع والسعي إلى أهداف ذات معنى للفرد.",
    examples: ["الإبداع", "التعلم بدافع الفضول", "تطوير المواهب"],
    learningContext: "يكتب المتعلم قصة من خياله لأنه يحب التعبير، لا من أجل الدرجة فقط.",
    teacherAction: "أتِح مشروعًا مفتوحًا واختيارًا بين طرائق عرض التعلم.",
    writingPrompt: "ما المهارة التي تحب تطويرها؟ اكتب ثلاث جمل تصف لماذا اخترتها.",
  },
  {
    id: "esteem",
    label: "التقدير",
    icon: "⭐",
    colorClass: "bg-emerald-200 text-emerald-950 border-emerald-400",
    widthClass: "md:w-[61%]",
    summary: "الشعور بالقيمة والكفاءة وتقدير الجهد والإنجاز.",
    examples: ["الثقة بالنفس", "احترام الذات", "الاعتراف بالجهد"],
    learningContext: "يحاول الطالب مرة أخرى بعد أن يسمع ملاحظة محددة تساعده على التحسن.",
    teacherAction: "قدّم تغذية راجعة تذكر الجهد والاستراتيجية والتقدم، دون مقارنة محرجة.",
    writingPrompt: "اكتب عبارة تشجيع صادقة لصديق حاول وتعلّم من خطئه.",
  },
  {
    id: "belonging",
    label: "الحب والانتماء",
    icon: "🤝",
    colorClass: "bg-rose-200 text-rose-950 border-rose-400",
    widthClass: "md:w-[74%]",
    summary: "العلاقات الداعمة، والقبول، والمودة، والشعور بأن للفرد مكانًا بين الآخرين.",
    examples: ["الصداقة", "الأسرة", "التعاون"],
    learningContext: "يشارك الطالب في الحوار عندما يشعر أن زملاءه يستمعون إليه باحترام.",
    teacherAction: "نظّم تعلمًا تعاونيًا بأدوار عادلة وتواصلًا محترمًا دون إكراه الإفصاح الشخصي.",
    writingPrompt: "صف موقفًا يساعد فيه الطلاب زميلًا جديدًا على الشعور بالترحيب.",
  },
  {
    id: "safety",
    label: "الأمان",
    icon: "🛡️",
    colorClass: "bg-sky-200 text-sky-950 border-sky-400",
    widthClass: "md:w-[87%]",
    summary: "الاستقرار والحماية من الأذى والخوف، والشعور بوجود قواعد عادلة.",
    examples: ["السلامة", "الاستقرار", "بيئة خالية من التنمر"],
    learningContext: "يسأل الطالب عن كلمة لا يفهمها عندما يعلم أن الخطأ لن يقابل بالسخرية.",
    teacherAction: "أرسِ قواعد تمنع السخرية والتنمّر وتسمح بالسؤال وطلب المساعدة بأمان.",
    writingPrompt: "اكتب جملتين تصفان فصلًا دراسيًا يشعر فيه الجميع بالأمان.",
  },
  {
    id: "physiological",
    label: "الاحتياجات الفسيولوجية",
    icon: "💧",
    colorClass: "bg-orange-200 text-orange-950 border-orange-400",
    widthClass: "md:w-full",
    summary: "احتياجات الجسم مثل الغذاء والماء والنوم والراحة والهواء والمأوى.",
    examples: ["الماء", "الغذاء", "النوم والراحة"],
    learningContext: "قد يصعب على المتعلم التركيز عندما يكون متعبًا أو عطشان.",
    teacherAction: "راعِ فترات الراحة واحتياجات الوصول إلى الماء، واطلب الدعم المؤسسي عند الحاجة.",
    writingPrompt: "اكتب ثلاث جمل عن عادة صحية تساعدك على الاستعداد للتعلم.",
  },
] as const;

export type NeedsSituation = {
  id: string;
  text: string;
  correctId: NeedId;
  explanation: string;
};

export const MASLOW_SITUATIONS: readonly NeedsSituation[] = [
  {
    id: "rest",
    text: "تثاءب تلميذ كثيرًا لأنه لم ينم جيدًا، ووجد صعوبة في الانتباه.",
    correctId: "physiological",
    explanation: "النوم والراحة من احتياجات الجسم. ويمكن أن تتداخل مع احتياجات أخرى.",
  },
  {
    id: "asking",
    text: "أرادت تلميذة السؤال، لكنها تخشى أن يسخر زملاؤها من خطئها.",
    correctId: "safety",
    explanation: "البيئة الآمنة تحمي من السخرية وتسمح بالتجربة والخطأ.",
  },
  {
    id: "group",
    text: "رحّب الصف بطالب جديد ودعاه إلى المشاركة في مشروع جماعي.",
    correctId: "belonging",
    explanation: "القبول والعلاقات الداعمة يساعدان على الشعور بالانتماء.",
  },
  {
    id: "feedback",
    text: "أشاد المعلم باستراتيجية طالبة في حل مشكلة وشرح كيف تحسّن عملها.",
    correctId: "esteem",
    explanation: "تقدير الجهد والكفاءة يعزز الشعور بالقدرة والقيمة.",
  },
  {
    id: "story",
    text: "كتبت طالبة قصة من ابتكارها لأنها تحب الإبداع وتريد تطوير موهبتها.",
    correctId: "self-actualization",
    explanation: "تطوير المواهب والتعبير الإبداعي أمثلة على تحقيق الذات.",
  },
] as const;

export function findMaslowLevel(id: NeedId): NeedLevel {
  const found = MASLOW_LEVELS.find((level) => level.id === id);
  if (!found) throw new Error("Unknown Maslow need");
  return found;
}

export function checkMaslowAnswer(situationId: string, selectedId: NeedId):
  { correct: boolean; explanation: string } | null {
  const situation = MASLOW_SITUATIONS.find((item) => item.id === situationId);
  if (!situation) return null;
  return {
    correct: situation.correctId === selectedId,
    explanation: situation.explanation,
  };
}
