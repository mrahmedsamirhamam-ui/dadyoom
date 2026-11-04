/**
 * An optional, teacher-reviewed formative recheck — never a student grade.
 * Inputs are transient; this helper has no storage, network or authentication.
 */
export type FeedbackRecheck = {
  baselineCorrect: number | null;
  baselineTotal: number | null;
  recheckCorrect: number | null;
  recheckTotal: number | null;
  recheckEvidence: string;
  comparable: boolean;
};

export type RecheckResult = {
  ready: boolean;
  state: "missing" | "not-comparable" | "improved" | "unchanged" | "lower";
  gainPercentagePoints: number | null;
  summary: string;
  nextAction: string;
  exportText: string;
};

function validScore(correct: number | null, total: number | null): boolean {
  return correct !== null &&
    total !== null &&
    Number.isInteger(correct) &&
    Number.isInteger(total) &&
    total >= 1 &&
    total <= 100 &&
    correct >= 0 &&
    correct <= total;
}

export function evaluateFeedbackRecheck(input: FeedbackRecheck): RecheckResult {
  const hasBaseline = validScore(input.baselineCorrect, input.baselineTotal);
  const hasRecheck = validScore(input.recheckCorrect, input.recheckTotal);
  const evidence = (input.recheckEvidence ?? "").trim().slice(0, 600);

  if (!hasBaseline || !hasRecheck || evidence.length < 12) {
    return {
      ready: false,
      state: "missing",
      gainPercentagePoints: null,
      summary: "لا توجد بعد نتيجتان صحيحتان وشاهد جديد كافٍ لإعادة القياس. لا يمكن إثبات تحسن من ملاحظة واحدة.",
      nextAction: "أعد تطبيق مهمة جديدة وسجل النتائج الصحيحة وعدد الفرص والشاهد، من دون تسجيل بيانات تعريف الطالب.",
      exportText: "",
    };
  }

  if (!input.comparable) {
    return {
      ready: false,
      state: "not-comparable",
      gainPercentagePoints: null,
      summary: "النتيجتان موجودتان، لكن المعلم لم يؤكد أن القياسين للمهارة نفسها وبمهمتين متقاربتين في الصعوبة ومعيار التصحيح.",
      nextAction: "راجع معيار التصحيح وتكافؤ المهمتين قبل المقارنة. لا تصدر حكمًا بالتحسن بناء على النسبة وحدها.",
      exportText: "",
    };
  }

  // Validated by guards above. Normalized percentage points, not a diagnosis.
  const before = (100 * Number(input.baselineCorrect)) / Number(input.baselineTotal);
  const after = (100 * Number(input.recheckCorrect)) / Number(input.recheckTotal);
  const delta = Math.round((after - before) * 10) / 10;
  const state = delta > 0 ? "improved" : delta < 0 ? "lower" : "unchanged";
  const direction = delta > 0 ? "ارتفعت" : delta < 0 ? "انخفضت" : "لم تتغير";
  const summary = [
    "مراجعة تكوينية تحت إشراف المعلم:",
    "كانت النتيجة الأولى " + input.baselineCorrect + " من " + input.baselineTotal,
    "وأصبحت في المهمة اللاحقة " + input.recheckCorrect + " من " + input.recheckTotal + ".",
    direction + " النسبة بمقدار " + Math.abs(delta).toLocaleString("ar-BH") + " نقطة مئوية.",
    "شاهد المهمة الجديدة: " + evidence + ".",
    "هذه مقارنة لمهمتين فقط وليست دليلًا منفردًا على إتقان دائم أو تحسن في جميع المهارات.",
  ].join(" ");
  const nextAction = delta > 0
    ? "استمر في التدريب بمواقف جديدة ثم تحقق من ثبات الأداء قبل اعتماد الإتقان."
    : delta < 0
      ? "راجع تكافؤ المهمتين وسبب الصعوبة وغيّر طريقة الدعم ثم أعد القياس."
      : "جرّب تدرجًا آخر في التدريس ثم مهمة انتقال مختلفة قبل الحكم على الإتقان.";

  return {
    ready: true,
    state,
    gainPercentagePoints: delta,
    summary,
    nextAction,
    exportText: summary + "\n\n" + nextAction,
  };
}
