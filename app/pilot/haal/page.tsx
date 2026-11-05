"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HALL_GOAL, PATHS, PATH_LABELS, PATH_CONTENT, recommendPath, suggestSupport,
  type LearningPath, type PublicQuestion, type QuestionBank,
} from "@/lib/adaptive-goal-paths/haal-public.mjs";

type Stage = "diagnostic" | "lesson" | "anchor" | "results";

const PATH_STYLES: Record<LearningPath, string> = {
  start: "border-emerald-600 bg-emerald-50 text-emerald-950",
  progress: "border-blue-600 bg-blue-50 text-blue-950",
  challenge: "border-violet-600 bg-violet-50 text-violet-950",
};
const PATH_ICONS: Record<LearningPath, string> = {
  start: "🌱",
  progress: "📚",
  challenge: "✨",
};

type PracticeFeedback = { correct: boolean; explanation: string | null };
type AnchorFeedback = { id: string; correct: boolean; explanation: string };
type AnchorResult = { correct: number; total: number; passedThisCheck: boolean; note: string; feedback: AnchorFeedback[] };
type DiagnosticResult = { correct: number; total: number; errorKinds: string[] };

async function gradePilot<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/pilot/haal", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goalId: HALL_GOAL.id, ...body }),
  });
  const result: unknown = await response.json();
  if (!response.ok || !result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
    throw new Error("تعذر تصحيح الإجابة. حاول مرة أخرى.");
  }
  return result as T;
}

function QuestionCard({
  question, value, onAnswer, showFeedback, feedback, showExplanation,
}: {
  question: PublicQuestion;
  value?: string;
  onAnswer: (id: string) => void;
  showFeedback: boolean;
  feedback?: PracticeFeedback;
  showExplanation?: boolean;
}) {
  const isCorrect = feedback?.correct === true;
  return (
    <fieldset className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <legend className="px-1 text-base font-bold leading-8 text-[#173f38]">{question.stem}</legend>
      <div className="mt-2 grid gap-3">
        {question.choices.map(choice => (
          <label key={choice.id} className={"flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium leading-6 transition-colors " +
            (value === choice.id ? "border-[#17665b] bg-[#e7f5ef] text-[#153f39]" : "border-stone-200 bg-stone-50 hover:bg-stone-100")}>
            <input type="radio" name={question.id} value={choice.id} checked={value === choice.id}
              onChange={() => onAnswer(choice.id)} className="h-4 w-4 accent-[#17665b]" />
            <span>{choice.label}</span>
          </label>
        ))}
      </div>
      {showFeedback && value ? (
        <div role="status" className={"mt-3 rounded-xl p-3 text-sm leading-7 " +
          (isCorrect ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950")}>
          {isCorrect ? "أحسنت. لقد ربطت الوصف بصاحبه." : "هذه محاولة مفيدة. اسأل: كيف كانت هيئة صاحب الفعل؟"}
          {(isCorrect || showExplanation) && feedback?.explanation && <p className="mt-1">{feedback.explanation}</p>}
        </div>
      ) : null}
    </fieldset>
  );
}

export default function AdaptiveHaalPilot() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [loadError, setLoadError] = useState("");
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState<PracticeFeedback | null>(null);
  const [anchorResult, setAnchorResult] = useState<AnchorResult | null>(null);
  const [stage, setStage] = useState<Stage>("diagnostic");
  const [path, setPath] = useState<LearningPath>("start");
  const [recommended, setRecommended] = useState<LearningPath | null>(null);
  const [diagnostic, setDiagnostic] = useState<Record<string, string>>({});
  const [anchor, setAnchor] = useState<Record<string, string>>({});
  const [anchorFormIndex, setAnchorFormIndex] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceAnswer, setPracticeAnswer] = useState<string>("");
  const [feedbackShown, setFeedbackShown] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [diagnosticHints, setDiagnosticHints] = useState<Record<string, boolean>>({});
  const [consecutiveSuccess, setConsecutiveSuccess] = useState(0);
  const [consecutiveStruggles, setConsecutiveStruggles] = useState(0);
  const [offer, setOffer] = useState<LearningPath | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [supportLanguage, setSupportLanguage] = useState<"ar" | "en">("ar");
  const [cefr, setCefr] = useState<"unspecified" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2">("unspecified");

  const content = PATH_CONTENT[path];
  const question = bank?.practice[path]?.[practiceIndex];
  const currentAnchor = bank?.anchorForms[anchorFormIndex] ?? [];
  const anchorReady = currentAnchor.length === 5 && currentAnchor.every(item => typeof anchor[item.id] === "string");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/pilot/haal", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("تعذر تحميل أسئلة الدرس.");
        const incoming: QuestionBank = await response.json();
        if (incoming.goalId !== HALL_GOAL.id || incoming.diagnostic.length !== 4 ||
            incoming.anchorForms.length !== 3 || incoming.anchorForms.some(form => form.length !== 5)) {
          throw new Error("بيانات التقييم غير مكتملة.");
        }
        setBank(incoming);
      })
      .catch(error => {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "تعذر تحميل الدرس.");
      });
    return () => controller.abort();
  }, []);

  function choosePath(chosen: LearningPath) {
    setPath(chosen);
    setPracticeIndex(0);
    setPracticeAnswer("");
    setHintCount(0);
    setConsecutiveStruggles(0);
    setConsecutiveSuccess(0);
    setOffer(null);
    setFeedbackShown(false);
    setPracticeFeedback(null);
    setApiError("");
    setStage("lesson");
  }

  async function finishDiagnostic() {
    if (!bank || busy || !bank.diagnostic.every(item => diagnostic[item.id])) return;
    setBusy(true);
    setApiError("");
    try {
      const result = await gradePilot<DiagnosticResult>({
        kind: "diagnostic", answers: diagnostic,
      });
      const selection = recommendPath({
        correct: result.correct, total: result.total,
        hintsUsed: Object.values(diagnosticHints).filter(Boolean).length,
        errorKinds: result.errorKinds,
      });
      setRecommended(selection);
      choosePath(selection);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "تعذر تشخيص المسار.");
    } finally {
      setBusy(false);
    }
  }

  async function checkPractice() {
    if (!practiceAnswer || !question || feedbackShown || busy) return;
    setBusy(true);
    setApiError("");
    try {
      const result = await gradePilot<PracticeFeedback>({
        kind: "practice", path, questionId: question.id,
        answers: { [question.id]: practiceAnswer },
      });
      const correct = result.correct;
      setPracticeFeedback(result);
      setFeedbackShown(true);
      const success = correct ? consecutiveSuccess + 1 : 0;
      const struggles = correct ? 0 : consecutiveStruggles + 1;
      setConsecutiveSuccess(success);
      setConsecutiveStruggles(struggles);
      const suggested = suggestSupport({ path, consecutiveSuccess: success, consecutiveStruggles: struggles });
      setOffer(suggested !== path ? suggested : null);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "تعذر تصحيح التمرين.");
    } finally {
      setBusy(false);
    }
  }

  async function submitAnchor() {
    if (!anchorReady || busy) return;
    setBusy(true);
    setApiError("");
    try {
      const result = await gradePilot<AnchorResult>({
        kind: "anchor", formIndex: anchorFormIndex, answers: anchor,
      });
      setAnchorResult(result);
      setStage("results");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "تعذر تصحيح التحقق.");
    } finally {
      setBusy(false);
    }
  }

  function nextPractice() {
    if (practiceIndex + 1 >= (bank?.practice[path]?.length ?? 0)) {
      setStage("anchor");
      setAnchor({});
      setAnchorResult(null);
      setShowExplanation(false);
    } else {
      setPracticeIndex(index => index + 1);
      setPracticeAnswer("");
      setFeedbackShown(false);
      setPracticeFeedback(null);
      setHintCount(0);
    }
  }

  function readAloud(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar";
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7faf7] px-4 py-6 text-[#1b3f37] sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-3">
          <Link href="/courses" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
            العودة إلى مستكشف الدروس
          </Link>
          <Link href="/pilot/haal/teacher" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
            معاينة لوحة المعلم (بيانات افتراضية)
          </Link>
          <p className="text-sm font-semibold text-[#587d71]">ضاديوم • تجربة تعليم متمايز • الصف السابع</p>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">درس الحال، بطريقتك أنت</h1>
          <p className="rounded-xl bg-white px-4 py-3 text-sm leading-7">{HALL_GOAL.objective}</p>
          <p className="text-sm leading-7 text-[#425b53]">الهدف واحد للجميع. نغيّر طريقة الشرح والدعم فقط. اختيار المسار لك، ويمكن تغييره في أي وقت.</p>
        </header>

        <section aria-label="اختيار طريقة التعلم" className="rounded-2xl border border-[#dce8e0] bg-white p-4 sm:p-5">
          <h2 className="text-lg font-bold">كيف تحب أن تتعلم اليوم؟</h2>
          <p className="mt-1 text-sm leading-6">لا يوجد تصنيف دائم أو مقارنة بطلاب آخرين.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {PATHS.map(item => (
              <button key={item} type="button" disabled={!bank || busy} onClick={() => choosePath(item)}
                aria-pressed={stage !== "diagnostic" && path === item}
                className={"min-h-24 rounded-xl border-2 p-3 text-right transition focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#d9ac55] " +
                  (stage !== "diagnostic" && path === item ? PATH_STYLES[item] : "border-stone-200 bg-stone-50 hover:border-stone-400")}>
                <span aria-hidden="true">{PATH_ICONS[item]}</span>
                <span className="mt-1 block font-bold">{PATH_LABELS[item]}</span>
                <span className="mt-1 block text-xs">{item === "start" ? "خطوة بخطوة" : item === "progress" ? "أفهم وأطبّق" : "أكتشف وأحلّل"}</span>
              </button>
            ))}
          </div>
          {recommended && <p className="mt-3 rounded-lg bg-[#f5f0df] p-3 text-sm leading-7">
            يقترح ضاد {PATH_LABELS[recommended]} بناءً على إجاباتك، ويمكنك اختيار أي مسار آخر.
          </p>}
        </section>

        {!bank && !loadError && <p role="status" className="rounded-xl bg-white p-4 text-sm">تحميل أسئلة الدرس...</p>}
        {loadError && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm">{loadError}</p>}
        {apiError && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm">{apiError}</p>}

        {stage === "diagnostic" && bank && (
          <section className="space-y-4">
            <h2 className="text-xl font-extrabold">اكتشف نقطة البداية</h2>
            <p className="text-sm leading-7">أربع أسئلة قصيرة لا تُسجّل في حسابك، ولا تدخل في التقدير النهائي. يمكنك تجاوزها باختيار أي مسار أعلاه.</p>
            {bank.diagnostic.map(item => (
              <div key={item.id} className="space-y-2">
                <QuestionCard question={item} value={diagnostic[item.id]}
                  onAnswer={answer => setDiagnostic(current => ({ ...current, [item.id]: answer }))} showFeedback={false} />
                <button type="button" disabled={Boolean(diagnosticHints[item.id])}
                  onClick={() => setDiagnosticHints(current => ({ ...current, [item.id]: true }))}
                  className="min-h-11 rounded-xl border border-[#b3c9ba] px-3 py-2 text-sm font-semibold disabled:cursor-default disabled:opacity-60">
                  {diagnosticHints[item.id] ? "تم فتح المساعدة" : "أحتاج تلميحًا لفهم السؤال"}
                </button>
                {diagnosticHints[item.id] && (
                  <p role="status" className="rounded-xl bg-[#f5f0df] p-3 text-sm leading-7">
                    ابحث عن كلمة تصف هيئة شخص وقت حدوث الفعل، ثم حدد من كان بهذه الهيئة. لا يلزم أن تكون الحال أول كلمة بعد الفعل.
                  </p>
                )}
              </div>
            ))}
            <button type="button" disabled={busy || !bank.diagnostic.every(item => diagnostic[item.id])} onClick={finishDiagnostic}
              className="min-h-12 w-full rounded-xl bg-[#174f47] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
              اقترح لي مسارًا مناسبًا
            </button>
          </section>
        )}

        {stage === "lesson" && bank && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-[#dce8e0] bg-white p-5">
              <p className="text-sm font-bold text-[#587d71]">{PATH_LABELS[path]} • نفس الهدف التعليمي</p>
              <h2 className="mt-2 text-2xl font-extrabold">{content.heading}</h2>
              <p className="mt-3 leading-8">{content.intro}</p>
              {path !== "challenge" && (
                <button type="button" onClick={() => readAloud(content.intro + " " + content.example)}
                  className="mt-3 min-h-11 rounded-lg border border-[#174f47] px-4 text-sm font-bold">
                  🔊 استمع إلى الشرح
                </button>
              )}
              {path === "challenge" ? (
                <details className="mt-4 rounded-xl border border-stone-200 p-3">
                  <summary className="cursor-pointer font-semibold">أريد مثالًا وتحليلًا</summary>
                  <p className="mt-3 leading-8">{content.example}</p>
                  <p className="mt-2 leading-8">{content.explanation}</p>
                </details>
              ) : (
                <div className="mt-4 rounded-xl bg-[#f2f7f3] p-4">
                  <h3 className="font-bold">مثال محلول</h3>
                  <p className="mt-2 text-lg font-semibold leading-8">{content.example}</p>
                  <p className="mt-2 leading-8">{content.explanation}</p>
                </div>
              )}
              <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-7">
                <strong>تطبيق وربط:</strong> {content.practice}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="إعدادات المساعدة اللغوية الاختيارية">
                <label className="text-sm font-bold">
                  لغة المساعدة
                  <select value={supportLanguage} onChange={event => setSupportLanguage(event.target.value as "ar" | "en")}
                    className="mt-2 min-h-12 w-full rounded-xl border border-[#b5c9b9] bg-white px-3 font-normal">
                    <option value="ar">عربية مبسطة</option>
                    <option value="en">English (support)</option>
                  </select>
                </label>
                <label className="text-sm font-bold">
                  مستوى العربية الذي تختاره لنفسك (اختياري)
                  <select value={cefr} onChange={event => setCefr(event.target.value as typeof cefr)}
                    className="mt-2 min-h-12 w-full rounded-xl border border-[#b5c9b9] bg-white px-3 font-normal">
                    <option value="unspecified">لا أرغب في التحديد</option>
                    {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                </label>
              </div>
              <p className="mt-2 text-xs leading-7 text-[#58736a]">
                هذه اختيارات للمساندة فقط؛ لا تصنفك ولا تغيّر مسار النحو أو درجة اختبار الهدف، ولا تُحفظ.
              </p>
              <button type="button" onClick={() => setShowTranslation(value => !value)}
                aria-expanded={showTranslation} className="mt-3 min-h-11 rounded-lg border border-[#d6c391] px-4 text-sm font-semibold">
                {showTranslation ? "إخفاء معاني الكلمات" : "مساعدة لغوية اختيارية"}
              </button>
              {showTranslation && (
                <div className="mt-2 rounded-xl bg-stone-50 p-4 text-sm leading-7">
                  <p>{cefr === "A1" || cefr === "A2" ?
                    "الحال تصف كيف كان الشخص وقت الفعل. مثال: جاءَ الطفلُ سعيدًا. كيف جاء؟ سعيدًا. مَن صاحب الحال؟ الطفل." :
                    content.glossary}</p>
                  {supportLanguage === "en" ? (
                    <p lang="en" dir="ltr" className="mt-2 text-left">The ḥāl describes the state of a person or thing when an action happens. The ṣāḥib al-ḥāl is the person or thing being described.</p>
                  ) : (
                    <p className="mt-2">اسأل: كيف حدث الفعل؟ ثم من الذي وُصف بهذه الهيئة؟</p>
                  )}
                  <p className="mt-1">الدعم اللغوي منفصل عن تقييم فهم مفهوم الحال. هذا تقدير اختياري، وليس اختبار CEFR رسميًا.</p>
                </div>
              )}
            </div>
            {question && (
              <div className="space-y-3">
                <p className="text-sm font-bold">تدريب {practiceIndex + 1} من {bank.practice[path].length}</p>
                <QuestionCard question={question} value={practiceAnswer} onAnswer={value => {
                  if (feedbackShown) return;
                  setPracticeAnswer(value);
                }} showFeedback={feedbackShown} feedback={practiceFeedback ?? undefined} />
                {!feedbackShown && (
                  <button type="button" disabled={busy || !practiceAnswer} onClick={checkPractice}
                    className="min-h-12 rounded-xl bg-[#174f47] px-5 py-3 font-bold text-white disabled:opacity-40">
                    تحقق من إجابتي
                  </button>
                )}
                {feedbackShown && practiceFeedback?.correct === false && (
                  <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm leading-7">يمكنك طلب تلميح، أو محاولة ثانية. لا تظهر الإجابة الصحيحة تلقائيًا.</p>
                    {hintCount > 0 && <p role="status" className="text-sm leading-7">
                      تلميح {hintCount}: {content.hints[hintCount - 1]}
                    </p>}
                    <div className="flex flex-wrap gap-2">
                      {hintCount < 3 && <button type="button" className="min-h-11 rounded-lg border border-amber-700 px-4 text-sm font-bold"
                        onClick={() => { setHintCount(n => n + 1); }}>
                        تلميح آخر
                      </button>}
                      <button type="button" className="min-h-11 rounded-lg border border-amber-700 px-4 text-sm font-bold"
                        onClick={() => { setPracticeAnswer(""); setFeedbackShown(false); setPracticeFeedback(null); }}>
                        أحاول مرة أخرى
                      </button>
                    </div>
                  </div>
                )}
                {offer && <div role="status" className="rounded-xl bg-[#f2f7f3] p-4 text-sm leading-7">
                  هل تريد تجربة {PATH_LABELS[offer]} الآن؟ القرار لك.
                  <button type="button" onClick={() => choosePath(offer)} className="mr-2 min-h-11 rounded-lg bg-[#174f47] px-4 font-bold text-white">
                    جرّب هذا المسار
                  </button>
                </div>}
                {feedbackShown && practiceFeedback?.correct === true && (
                  <button type="button" onClick={nextPractice} className="min-h-12 rounded-xl bg-[#174f47] px-5 py-3 font-bold text-white">
                    {practiceIndex + 1 === bank.practice[path].length ? "الاختبار المشترك لجميع المسارات" : "التدريب التالي"}
                  </button>
                )}
                <button type="button" onClick={() => { setStage("anchor"); setAnchor({}); }}
                  className="min-h-11 rounded-xl border border-stone-300 px-4 text-sm font-bold">
                  انتقل إلى التحقق المشترك
                </button>
              </div>
            )}
          </section>
        )}

        {stage === "anchor" && bank && (
          <section className="space-y-4">
            <h2 className="text-xl font-extrabold">تحقق مشترك من الهدف</h2>
            <p className="text-sm leading-7">معيار النجاح واحد لجميع المسارات: أربع إجابات صحيحة من خمس على الأقل. هذه صيغة {anchorFormIndex + 1} من {bank.anchorForms.length}، بأمثلة تختلف عن الصيغة السابقة. الإعادة في الجلسة نفسها ليست تحققًا متباعدًا ولا تمنح إتقانًا نهائيًا.</p>
            {currentAnchor.map(item => (
              <QuestionCard key={item.id} question={item} value={anchor[item.id]}
                onAnswer={answer => setAnchor(current => ({ ...current, [item.id]: answer }))} showFeedback={false}/>
            ))}
            <button type="button" disabled={busy || !anchorReady} onClick={submitAnchor}
              className="min-h-12 w-full rounded-xl bg-[#174f47] px-5 py-3 font-bold text-white disabled:opacity-40">
              اعرض نتيجة التحقق
            </button>
          </section>
        )}

        {stage === "results" && anchorResult && bank && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="text-2xl font-extrabold">النتيجة: {anchorResult.correct} من {anchorResult.total}</h2>
              <p className="mt-2 text-sm leading-8">
                {anchorResult.passedThisCheck ?
                  "حققت معيار هذا التحقق. واصل مراجعة المفهوم في جلسات لاحقة." :
                  "أنت في مرحلة التعلم. اختر شرحًا بديلًا وأعد المحاولة بأمثلة جديدة."}
              </p>
              <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm leading-7">{anchorResult.note}</p>
            </div>
            <button type="button" className="min-h-11 rounded-lg border border-stone-300 px-4 font-bold" onClick={() => setShowExplanation(value => !value)}>
              {showExplanation ? "أخفِ التصحيح" : "راجع سبب الإجابات"}
            </button>
            {showExplanation && currentAnchor.map(item => (
              <QuestionCard key={item.id} question={item} value={anchor[item.id]} onAnswer={() => {}}
                showFeedback feedback={anchorResult.feedback.find(row => row.id === item.id)} showExplanation/>
            ))}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => { setStage("lesson"); setPracticeAnswer(""); setPracticeIndex(0); setFeedbackShown(false); setPracticeFeedback(null); }}
                className="min-h-12 rounded-xl bg-[#174f47] px-5 font-bold text-white">مراجعة شرح المسار</button>
              <button type="button" onClick={() => { setAnchorFormIndex(index => (index + 1) % bank.anchorForms.length); setStage("anchor"); setAnchor({}); setAnchorResult(null); setShowExplanation(false); }}
                className="min-h-12 rounded-xl border border-[#174f47] px-5 font-bold">أتحقق بأمثلة جديدة</button>
            </div>
          </section>
        )}

        <footer className="rounded-xl border border-[#e8debf] bg-[#fffdf3] p-4 text-xs leading-7">
          {HALL_GOAL.disclaimer} ترسل الإجابات مؤقتًا إلى واجهة التصحيح التجريبي للخادم، دون تسجيل درجات أو حفظ بيانات الطالب في قاعدة البيانات أو التخزين المحلي.
          هذه خدمة تعليمية عامة وليست آلية امتحان مؤمنة بمصادقة الطالب؛ الإتقان الرسمي يحتاج جلسات متباعدة وتصحيحًا مُصادقًا عليه وسجل محاولات محميًا ومراجعة المعلم.
        </footer>
      </div>
    </main>
  );
}
