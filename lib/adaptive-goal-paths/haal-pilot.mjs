/**
 * A single measurable objective with three non-stigmatizing support pathways.
 * Prototype: no authentication, tracking, storage, or officially certified mastery.
 * Production assessment must be checked and saved on the server, not in the browser.
 */
import { HALL_GOAL } from "./haal-public.mjs";
export { PATHS, PATH_LABELS, HALL_GOAL, PATH_CONTENT, recommendPath, suggestSupport } from "./haal-public.mjs";

const q = (id, stem, choices, correctId, why, errorKind = "grammar", errorsByChoice = {}) =>
  Object.freeze({ id, stem, choices: Object.freeze(choices.map(([id, label]) => Object.freeze({ id, label }))), correctId, why, errorKind, errorsByChoice: Object.freeze(errorsByChoice) });

export const DIAGNOSTIC = Object.freeze([
  q("d1", "عادَ المسافرُ مسرورًا. ما الحال وصاحبه؟", [["a", "مسرورًا — المسافر"], ["b", "المسافر — مسرورًا"], ["c", "عاد — المسافر"]], "a", "مسرورًا تصف هيئة المسافر عند العودة.", "grammar", { b: "role_reversal", c: "verb_as_haal" }),
  q("d2", "دخلَ الطفلُ ضاحكًا. ما الحال وصاحبه؟", [["a", "الطفل — ضاحكًا"], ["b", "ضاحكًا — الطفل"], ["c", "دخل — الطفل"]], "b", "ضاحكًا تبين كيف دخل الطفل.", "grammar", { a: "role_reversal", c: "verb_as_haal" }),
  q("d3", "جلستْ الطالبةُ هادئةً. ما الحال وصاحبه؟", [["a", "جلست — الطالبة"], ["b", "الطالبة — هادئةً"], ["c", "هادئةً — الطالبة"]], "c", "هادئةً تبين هيئة الطالبة وقت الجلوس.", "grammar", { a: "verb_as_haal", b: "role_reversal" }),
  q("d4", "وقفَ الحارسُ منتبهًا. ما الحال وصاحبه؟", [["a", "منتبهًا — الحارس"], ["b", "الحارس — منتبهًا"], ["c", "وقف — الحارس"]], "a", "منتبهًا تبين هيئة الحارس وقت الوقوف.", "grammar", { b: "role_reversal", c: "verb_as_haal" }),
]);

export const ANCHOR = Object.freeze([
  q("a1", "وصلَ الضيفُ مبتسمًا. حدد الحال وصاحبه.", [["a", "الضيف — مبتسمًا"], ["b", "مبتسمًا — الضيف"], ["c", "وصل — الضيف"]], "b", "مبتسمًا حال منصوبة؛ وصاحبها الضيف."),
  q("a2", "شاهدتُ الطائرَ محلّقًا. حدد الحال وصاحبه.", [["a", "محلّقًا — الطائر"], ["b", "الطائر — محلّقًا"], ["c", "شاهدت — الطائر"]], "a", "محلّقًا تبين هيئة الطائر حين شاهدته."),
  q("a3", "رجعتِ الطبيبةُ مطمئنةً. حدد الحال وصاحبه.", [["a", "الطبيبة — مطمئنةً"], ["b", "رجعت — الطبيبة"], ["c", "مطمئنةً — الطبيبة"]], "c", "مطمئنةً تصف هيئة الطبيبة عند الرجوع."),
  q("a4", "تكلّمَ التلميذُ واثقًا. حدد الحال وصاحبه.", [["a", "واثقًا — التلميذ"], ["b", "التلميذ — واثقًا"], ["c", "تكلّم — التلميذ"]], "a", "واثقًا تصف هيئة التلميذ أثناء الكلام."),
  q("a5", "خرجَ اللاعبون فرحين. حدد الحال وصاحبه.", [["a", "اللاعبون — فرحين"], ["b", "فرحين — اللاعبون"], ["c", "خرج — اللاعبون"]], "b", "فرحين حال جمع مذكر سالم منصوبة بالياء وصاحبها اللاعبون."),
]);

/** Three comparable five-item checks, not three repeats of the same questions. */
export const ANCHOR_FORMS = Object.freeze([
  ANCHOR,
  Object.freeze([
    q("b1", "عادَ العاملُ نشيطًا. حدد الحال وصاحبه.", [["a", "العامل — نشيطًا"], ["b", "نشيطًا — العامل"], ["c", "عاد — العامل"]], "b", "نشيطًا يصف هيئة العامل عند عودته."),
    q("b2", "شاهدتُ السفينةَ متحركةً. حدد الحال وصاحبه.", [["a", "متحركةً — السفينة"], ["b", "السفينة — متحركةً"], ["c", "شاهدت — السفينة"]], "a", "متحركةً حال من السفينة؛ وصاحب الحال هنا مفعول به."),
    q("b3", "وقفَ الأطفالُ صامتين. حدد الحال وصاحبه.", [["a", "الأطفال — صامتين"], ["b", "وقف — الأطفال"], ["c", "صامتين — الأطفال"]], "c", "صامتين حال منصوبة بالياء؛ صاحبها الأطفال."),
    q("b4", "وصلتِ الزائراتُ مسروراتٍ. حدد الحال وصاحبه.", [["a", "مسروراتٍ — الزائرات"], ["b", "الزائرات — مسروراتٍ"], ["c", "وصلت — الزائرات"]], "a", "مسروراتٍ حال جمع مؤنث سالم منصوبة بالكسرة وصاحبها الزائرات."),
    q("b5", "رأيتُ الطالبةَ واقفةً. حدد الحال وصاحبه.", [["a", "الطالبة — واقفةً"], ["b", "واقفةً — الطالبة"], ["c", "رأيت — الطالبة"]], "b", "واقفةً حال من الطالبة؛ وهي صاحب الحال."),
  ]),
  Object.freeze([
    q("c1", "رجعَ البحّارُ سالمًا. حدد الحال وصاحبه.", [["a", "سالمًا — البحّار"], ["b", "البحّار — سالمًا"], ["c", "رجع — البحّار"]], "a", "سالمًا حال من البحّار، تبين هيئته عند الرجوع."),
    q("c2", "لاحظتُ القمرَ منيرًا. حدد الحال وصاحبه.", [["a", "القمر — منيرًا"], ["b", "لاحظت — القمر"], ["c", "منيرًا — القمر"]], "c", "منيرًا حال من القمر، وصاحبها مفعول به."),
    q("c3", "صعدَ الطلابُ مسرعين. حدد الحال وصاحبه.", [["a", "الطلاب — مسرعين"], ["b", "مسرعين — الطلاب"], ["c", "صعد — الطلاب"]], "b", "مسرعين حال منصوبة بالياء؛ صاحبها الطلاب."),
    q("c4", "حضرتِ المعلماتُ مبتسماتٍ. حدد الحال وصاحبه.", [["a", "مبتسماتٍ — المعلمات"], ["b", "المعلمات — مبتسماتٍ"], ["c", "حضرت — المعلمات"]], "a", "مبتسماتٍ حال جمع مؤنث سالم، وصاحبها المعلمات."),
    q("c5", "رأيتُ الفتياتِ نشيطاتٍ. حدد الحال وصاحبه.", [["a", "الفتيات — نشيطاتٍ"], ["b", "رأيت — الفتيات"], ["c", "نشيطاتٍ — الفتيات"]], "c", "نشيطاتٍ حال من الفتيات، وعلامة نصبها الكسرة."),
  ]),
]);

export function assessQuestions(questions, answers) {
  const rows = questions.map(item => ({
    id: item.id,
    correct: answers?.[item.id] === item.correctId,
    answered: typeof answers?.[item.id] === "string",
    errorKind: !answers?.[item.id] || answers?.[item.id] === item.correctId
      ? null
      : item.errorsByChoice?.[answers[item.id]] ?? item.errorKind,
  }));
  const correct = rows.filter(row => row.correct).length;
  return { correct, total: rows.length, ratio: rows.length ? correct / rows.length : 0, rows };
}

export function assessAnchor(answers, form = ANCHOR) {
  const assessment = assessQuestions(form, answers);
  return {
    ...assessment,
    passedThisCheck: assessment.correct >= HALL_GOAL.mastery.minimumCorrect,
    certifiedMastery: false,
    note: "تجاوز اختبار واحد لا يعني الإتقان النهائي: يلزم تكرار التحقق في ثلاث جلسات متباعدة مع حفظ النتائج من الخادم.",
  };
}

/** Graded practice questions are server-owned; NEVER import this module in a client component. */
export const PRACTICE_BANK = Object.freeze({
  start: [
    { id: "s1", stem: "دخلَ الطفلُ ضاحكًا. من الذي كان يضحك؟ وما الكلمة التي تصف هيئته؟",
      choices: [{ id: "a", label: "الطفل — ضاحكًا" }, { id: "b", label: "ضاحكًا — الطفل" }, { id: "c", label: "دخل — الطفل" }],
      correctId: "a", why: "الطفل هو صاحب الحال؛ وضاحكًا الحال التي تجيب عن سؤال: كيف دخل؟", errorKind: "grammar" },
    { id: "s2", stem: "جلستْ الفتاةُ هادئةً. حدد الحال وصاحب الحال.",
      choices: [{ id: "a", label: "الفتاة — هادئةً" }, { id: "b", label: "هادئةً — الفتاة" }, { id: "c", label: "جلست — الفتاة" }],
      correctId: "b", why: "هادئةً حال؛ والفتاة صاحبة الحال.", errorKind: "grammar" },
  ],
  progress: [
    { id: "p1", stem: "رأيتُ القمرَ ساطعًا. ما الحال وصاحبه؟",
      choices: [{ id: "a", label: "القمر — ساطعًا" }, { id: "b", label: "رأيت — القمر" }, { id: "c", label: "ساطعًا — القمر" }],
      correctId: "c", why: "ساطعًا حال من القمر، رغم أن القمر مفعول به.", errorKind: "grammar" },
    { id: "p2", stem: "دخلَ المسافرُ متعبًا. ما الحال وصاحبه؟",
      choices: [{ id: "a", label: "متعبًا — المسافر" }, { id: "b", label: "المسافر — متعبًا" }, { id: "c", label: "دخل — المسافر" }],
      correctId: "a", why: "متعبًا يبين هيئة المسافر عند دخوله.", errorKind: "grammar" },
  ],
  challenge: [
    { id: "c1", stem: "شاهدتُ المتسابقين متفوقين. ما الحال وصاحبه؟",
      choices: [{ id: "a", label: "المتسابقين — متفوقين" }, { id: "b", label: "متفوقين — المتسابقين" }, { id: "c", label: "شاهدت — المتسابقين" }],
      correctId: "b", why: "متفوقين حال منصوبة بالياء لجمع المذكر السالم، وصاحبها المتسابقين.", errorKind: "grammar" },
    { id: "c2", stem: "قابلتُ المعلماتِ سعيداتٍ. ما الحال وصاحبها؟",
      choices: [{ id: "a", label: "سعيداتٍ — المعلمات" }, { id: "b", label: "المعلمات — سعيداتٍ" }, { id: "c", label: "قابلت — المعلمات" }],
      correctId: "a", why: "سعيداتٍ حال جمع مؤنث سالم، وصاحبها المعلمات.", errorKind: "grammar" },
  ],
});
