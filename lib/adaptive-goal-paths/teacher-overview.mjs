/**
 * Aggregate-only demonstration of how a teacher can monitor ONE learning goal.
 * No database access and no learner identities. All 30 records below are fictional.
 * NEVER use this sample to make any claim about real students or system efficacy.
 */
import { HALL_GOAL, PATHS, PATH_LABELS } from "./haal-pilot.mjs";

export const MISTAKE_LABELS = Object.freeze({
  role_reversal: "الخلط بين الحال وصاحبها",
  verb_as_haal: "عدّ الفعل حالًا",
  grammar: "حاجة إلى مراجعة المهارة",
  vocabulary: "صعوبة في المفردات",
  pronunciation: "تدريب نطق مستقل",
});

export const STRATEGY_CARDS = Object.freeze([
  { id: "model", title: "أشرح – نحل معًا – تحل وحدك", fit: "البداية", action: "ابدأ بتحديد الحال بصوت واضح ثم أخفِ خطوات الحل تدريجيًا.", pitfall: "عرض الإجابة دون كشف خطوات التفكير" },
  { id: "thinkaloud", title: "النمذجة بالتفكير بصوت مرتفع", fit: "عند تكرار خطأ المفهوم", action: "فسّر سؤال كيف؟ وما وصف الهيئة؟", pitfall: "تحويل النمذجة إلى تلقين" },
  { id: "fading", title: "تلاشي الدعم تدريجيًا", fit: "بعد تحسن الدقة", action: "أزل التلميح الموجه واطلب تبرير الاختيار.", pitfall: "إيقاف الدعم فجأة" },
  { id: "discovery", title: "الاكتشاف الموجه", fit: "مسار التحدي", action: "قدّم جملتين أحد صاحبي الحال فيهما مفعول به.", pitfall: "ترك الطالب دون سؤال مرشد" },
  { id: "problem", title: "مشكلة لغوية حقيقية", fit: "التقدم والتحدي", action: "أعط وصفًا خاطئًا للحال ليكتشف الطالب سبب الخطأ.", pitfall: "إبعاد التدريب عن هدف الدرس" },
  { id: "story", title: "التعلم في سياق قصصي", fit: "القراءة والمفردات", action: "اختر موقفًا قصيرًا من النص المعتمد يستعمل حالًا.", pitfall: "استبدال نص الكتاب بقصة غير مطابقة" },
  { id: "conceptmap", title: "خريطة مفاهيم", fit: "عندما تختلط المفاهيم", action: "اربط الفعل وصاحب الحال والحال بأسهم بسيطة.", pitfall: "ألوان للزينة دون تفسير" },
  { id: "multisensory", title: "تعلم متعدد الحواس", fit: "تباين طريقة التلقي", action: "اعرض الجملة بصريًا واقرأها صوتيًا ورتب الكلمات باللمس.", pitfall: "ربط قدرة القراءة بسرعة الاستجابة" },
  { id: "sorting", title: "التصنيف والبناء", fit: "مسار التقدم", action: "صنّف الكلمات إلى فعل وصاحب حال وحال.", pitfall: "اعتماد التصنيف من غير سؤال لماذا" },
  { id: "peer", title: "تعليم الأقران", fit: "بعد الاستيعاب", action: "دع الطالب يشرح سبب كون الوصف حالًا مع عدم كشف مستواه.", pitfall: "مقارنة الطلاب أو إحراجهم" },
  { id: "retrieval", title: "الاسترجاع النشط", fit: "تثبيت مفهوم الدرس", action: "اطلب تحديد الحال في مثال جديد دون النظر للشرح.", pitfall: "تكرار نفس صياغة المثال" },
  { id: "spaced", title: "المراجعة المتباعدة", fit: "التحقق من الاحتفاظ", action: "اسأل بأمثلة متكافئة في ثلاث جلسات منفصلة.", pitfall: "اعتبار نجاح جلسة واحدة إتقانًا نهائيًا" },
]);

export const ASSESSMENT_TOOLS = Object.freeze([
  { id: "picture", name: "اختيار مصوّر", use: "مفردات ومواقف تتطلب تعرّف الهيئة", criterion: "صحة المفهوم لا جمال الصورة" },
  { id: "matching", name: "مطابقة", use: "مطابقة الحال بصاحبها", criterion: "رابط دلالي صحيح" },
  { id: "drag", name: "إكمال متدرج", use: "مسار البداية بعد مثال محلول", criterion: "الكلمة تحدد الهيئة لا الفعل" },
  { id: "correct", name: "تصحيح خطأ", use: "تمييز خطأ حال/صاحب حال", criterion: "تصحيح وتعليل" },
  { id: "transform", name: "تحويل جملة", use: "التقدم", criterion: "ثبات العلاقة الدلالية" },
  { id: "short", name: "إجابة قصيرة", use: "تحديد الحال وصاحبه", criterion: "تحديد العنصرين بوضوح" },
  { id: "audio", name: "تسجيل صوتي اختياري", use: "قياس النطق مستقلًا", criterion: "لا يفترض أن ضعف النطق ضعف المفهوم" },
  { id: "analysis", name: "تحليل نص", use: "التحدي", criterion: "استخراج الحال وصاحبه مع دليل" },
  { id: "writing", name: "إنتاج كتابي", use: "تطبيق في سياق جديد", criterion: "صحة الحال والصاحب لا زخرفة الأسلوب" },
]);

export const HALL_RUBRIC = Object.freeze({
  goalId: HALL_GOAL.id,
  criteria: Object.freeze([
    { id: "identify", label: "تحديد الحال وصاحب الحال", levels: ["لم يحدد العنصرين", "حدد عنصرًا واحدًا", "حدد العنصرين بدقة"] },
    { id: "explain", label: "تفسير العلاقة", levels: ["لا يربط الوصف بصاحبه", "يذكر سؤال كيف؟", "يفسر الهيئة وصاحبها من السياق"] },
  ]),
});

/** Deterministic synthetic sample. NEVER join to real accounts. */
export function createFictionalClass(size = 30) {
  if (!Number.isInteger(size) || size < 0 || size > 100) throw new RangeError("Demo size must be 0..100");
  return Array.from({ length: size }, (_, index) => {
    const path = PATHS[index % 3];
    const correct = (index * 7 + 3) % 6;
    const hints = (index * 11) % 4;
    const misconception = index % 4 === 0 ? "role_reversal" : index % 4 === 1 ? "verb_as_haal" : index % 4 === 2 ? "grammar" : null;
    return Object.freeze({
      // No IDs, names, ages, contact details, account references or timestamps.
      goalId: HALL_GOAL.id,
      selectedPath: path,
      anchorCorrect: correct,
      hintsUsed: hints,
      misconception,
      verified: false,
    });
  });
}

/** Summarize one goal with aggregate data only: no learner-level output. */
export function buildTeacherGoalOverview(records, goal = HALL_GOAL) {
  if (!Array.isArray(records)) throw new TypeError("Expected assessment records");
  const goalRows = records.filter(row => row?.goalId === goal.id);
  const distribution = Object.fromEntries(PATHS.map(path => [path, 0]));
  const errors = Object.fromEntries(Object.keys(MISTAKE_LABELS).map(kind => [kind, 0]));
  let checkPasses = 0;
  let supportInvites = 0;
  let totalHints = 0;
  let unverified = 0;
  for (const row of goalRows) {
    if (!PATHS.includes(row.selectedPath) ||
      !Number.isInteger(row.anchorCorrect) ||
      row.anchorCorrect < 0 || row.anchorCorrect > goal.mastery.questionsPerCheck ||
      !Number.isInteger(row.hintsUsed) || row.hintsUsed < 0) {
      throw new TypeError("Invalid non-identifying goal assessment record");
    }
    distribution[row.selectedPath] += 1;
    if (row.anchorCorrect >= goal.mastery.minimumCorrect) checkPasses += 1;
    if (row.anchorCorrect < goal.mastery.minimumCorrect) supportInvites += 1;
    totalHints += row.hintsUsed;
    if (row.verified !== true) unverified += 1;
    if (row.misconception !== null && row.misconception !== undefined) {
      if (!Object.hasOwn(errors, row.misconception)) throw new TypeError("Unknown misconception");
      errors[row.misconception] += 1;
    }
  }
  const total = goalRows.length;
  return Object.freeze({
    objective: goal.objective,
    goalId: goal.id,
    total,
    paths: Object.freeze(PATHS.map(path => Object.freeze({
      path,
      label: PATH_LABELS[path],
      count: distribution[path],
    }))),
    checkPasses,
    supportInvites,
    unverified,
    averageHints: total ? Math.round((totalHints / total) * 10) / 10 : 0,
    misconceptions: Object.freeze(Object.entries(errors).filter(([, count]) => count > 0).map(([kind, count]) =>
      Object.freeze({ kind, label: MISTAKE_LABELS[kind], count }))),
    illustrativeOnly: true,
    certifiedMasteryCount: null,
    privacyNote: "بيانات افتراضية مجمّعة للعرض فقط؛ لا تُعرض أسماء أو سجلات فردية، ولا تمنح إتقانًا رسميًا.",
  });
}
