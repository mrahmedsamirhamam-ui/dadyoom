/**
 * Original Dadyoom enrichment material, not a national curriculum or
 * a certified CEFR / ACTFL proficiency assessment. Pilot units only.
 */
export type ArabicLifeQuestion = {
  id: string;
  prompt: string;
  choices: readonly [string, string, string];
  correctIndex: 0 | 1 | 2;
  hint: string;
  explanation: string;
};

export type ArabicLifeUnit = {
  id: string;
  title: string;
  context: string;
  indicativeLevel: "A1" | "A1–A2";
  outcome: string;
  durationMinutes: number;
  dialogue: readonly { speaker: string; text: string }[];
  vocabulary: readonly { term: string; meaning: string }[];
  questions: readonly ArabicLifeQuestion[];
  guidedRoleplay: string;
  independentRoleplay: string;
  writingTask: string;
};

export const ARABIC_LIFE_UNITS: readonly ArabicLifeUnit[] = [
  {
    id: "introductions",
    title: "نتعارف بالعربية",
    context: "التعارف",
    indicativeLevel: "A1",
    outcome: "أن يعرّف المتعلم بنفسه ويسأل شخصًا عن اسمه وبلده في حوار قصير.",
    durationMinutes: 15,
    dialogue: [
      { speaker: "سلمى", text: "مرحبًا، اسمي سلمى. ما اسمك؟" },
      { speaker: "يوسف", text: "أهلًا، اسمي يوسف." },
      { speaker: "سلمى", text: "من أين أنت يا يوسف؟" },
      { speaker: "يوسف", text: "أنا من البحرين، وأسكن في المنامة." },
      { speaker: "سلمى", text: "سعيدة بلقائك!" },
      { speaker: "يوسف", text: "وأنا أيضًا." },
    ],
    vocabulary: [
      { term: "ما اسمك؟", meaning: "سؤال للتعرّف على اسم شخص" },
      { term: "من أين أنت؟", meaning: "سؤال عن البلد أو المكان" },
      { term: "سعيد بلقائك", meaning: "عبارة ترحيب عند التعارف" },
    ],
    questions: [
      {
        id: "intro-name",
        prompt: "أي عبارة تستخدم للسؤال عن اسم شخص؟",
        choices: ["كم الساعة؟", "ما اسمك؟", "أين المكتبة؟"],
        correctIndex: 1,
        hint: "ابحث في بداية الحوار عن سؤال أجاب عنه يوسف باسمه.",
        explanation: "قالت سلمى: «ما اسمك؟»، ثم أجاب يوسف باسمه.",
      },
      {
        id: "intro-city",
        prompt: "في أي مدينة يسكن يوسف؟",
        choices: ["المنامة", "الرياض", "مسقط"],
        correctIndex: 0,
        hint: "اقرأ إجابة يوسف عن بلده ومكان سكنه.",
        explanation: "ذكر يوسف أنه من البحرين ويسكن في المنامة.",
      },
    ],
    guidedRoleplay: "قل: «مرحبًا، اسمي ...، وأنا من ...». استبدل الفراغات بمعلومات تختارها.",
    independentRoleplay: "تخيّل أنك تتعرف إلى زميل جديد. اسأله عن اسمه وبلده، ثم رحّب به.",
    writingTask: "اكتب ثلاث جمل قصيرة تقدم فيها نفسك، مع اسم وبلد وعبارة ترحيب. يمكنك استخدام معلومات خيالية.",
  },
  {
    id: "shopping",
    title: "في المتجر",
    context: "التسوّق",
    indicativeLevel: "A1",
    outcome: "أن يطلب المتعلم سلعة ويسأل عن سعرها ويشكر البائع بأدب.",
    durationMinutes: 18,
    dialogue: [
      { speaker: "البائع", text: "مرحبًا، كيف أساعدك؟" },
      { speaker: "المشتري", text: "أريد كيلوغرامًا من التفاح، من فضلك." },
      { speaker: "البائع", text: "تفضل. هل تريد شيئًا آخر؟" },
      { speaker: "المشتري", text: "لا، شكرًا. كم السعر؟" },
      { speaker: "البائع", text: "ثلاثة دنانير." },
      { speaker: "المشتري", text: "تفضل، وشكرًا لك." },
    ],
    vocabulary: [
      { term: "من فضلك", meaning: "عبارة مهذبة للطلب" },
      { term: "كم السعر؟", meaning: "سؤال عن ثمن السلعة" },
      { term: "شيئًا آخر", meaning: "سلعة إضافية" },
    ],
    questions: [
      {
        id: "shop-item",
        prompt: "ماذا اشترى المشتري؟",
        choices: ["الخبز", "البرتقال", "التفاح"],
        correctIndex: 2,
        hint: "انظر إلى أول طلب من المشتري.",
        explanation: "طلب المشتري كيلوغرامًا من التفاح.",
      },
      {
        id: "shop-price",
        prompt: "ما السعر المذكور في الحوار؟",
        choices: ["ثلاثة دنانير", "ديناران", "خمسة دنانير"],
        correctIndex: 0,
        hint: "اقرأ جواب البائع بعد «كم السعر؟».",
        explanation: "قال البائع إن السعر ثلاثة دنانير.",
      },
    ],
    guidedRoleplay: "قل للبائع: «أريد ... من فضلك. كم السعر؟». اختر سلعة من عندك.",
    independentRoleplay: "مثّل مع زميل دور المشتري والبائع، ثم بدّلا الدورين.",
    writingTask: "اكتب حوارًا من أربع جمل على الأقل بين بائع ومشترٍ، مستخدمًا «من فضلك» و«كم السعر؟».",
  },
  {
    id: "directions",
    title: "كيف أصل إلى المكتبة؟",
    context: "الاتجاهات",
    indicativeLevel: "A1–A2",
    outcome: "أن يسأل المتعلم عن مكان قريب ويفهم توجيهين بسيطين للوصول إليه.",
    durationMinutes: 20,
    dialogue: [
      { speaker: "مريم", text: "عذرًا، أين المكتبة؟" },
      { speaker: "فارس", text: "اذهبي مباشرة، ثم انعطفي يمينًا." },
      { speaker: "مريم", text: "هل المكتبة بعيدة؟" },
      { speaker: "فارس", text: "لا، هي بجانب المدرسة." },
      { speaker: "مريم", text: "شكرًا جزيلًا!" },
      { speaker: "فارس", text: "على الرحب والسعة." },
    ],
    vocabulary: [
      { term: "مباشرة", meaning: "إلى الأمام دون انعطاف" },
      { term: "يمينًا", meaning: "في الاتجاه المقابل لليسار" },
      { term: "بجانب", meaning: "قريبًا من الشيء وملاصقًا له" },
    ],
    questions: [
      {
        id: "route-turn",
        prompt: "إلى أي جهة تنعطف مريم بعد السير مباشرة؟",
        choices: ["يسارًا", "يمينًا", "إلى الخلف"],
        correctIndex: 1,
        hint: "استمع أو اقرأ تعليمات فارس، وركّز على الكلمة بعد «ثم».",
        explanation: "قال فارس: «ثم انعطفي يمينًا».",
      },
      {
        id: "route-place",
        prompt: "بجانب أي مكان تقع المكتبة؟",
        choices: ["المستشفى", "المتجر", "المدرسة"],
        correctIndex: 2,
        hint: "ابحث عن كلمة «بجانب» في الحوار.",
        explanation: "ذكر فارس أن المكتبة بجانب المدرسة.",
      },
    ],
    guidedRoleplay: "قل: «عذرًا، أين ...؟» ثم أجب: «اذهب مباشرة، ثم انعطف ...».",
    independentRoleplay: "ارسم طريقًا تخيليًا بين المدرسة والمكتبة واشرحه شفهيًا لزميل.",
    writingTask: "اكتب توجيهين للوصول إلى مكان قريب، مستخدمًا «مباشرة» و«يمينًا» أو «يسارًا».",
  },
];

export function getArabicLifeUnit(id: string): ArabicLifeUnit | undefined {
  return ARABIC_LIFE_UNITS.find((unit) => unit.id === id);
}
