"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ANCHOR_FORMS,
  DIAGNOSTIC,
  HALL_GOAL,
  PATHS,
  PATH_LABELS,
  PATH_CONTENT,
  assessAnchor,
  assessQuestions,
  recommendPath,
  suggestSupport,
  type LearningPath,
  type TeachingQuestion,
} from "@/lib/adaptive-goal-paths/haal-pilot.mjs";

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

// Different supported practice, identical objective and identical exit check.
const PRACTICE: Record<LearningPath, readonly TeachingQuestion[]> = {
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
};

function QuestionCard({
  question, value, onAnswer, showFeedback, showExplanation,
}: {
  question: TeachingQuestion;
  value?: string;
  onAnswer: (id: string) => void;
  showFeedback: boolean;
  showExplanation?: boolean;
}) {
  const isCorrect = value === question.correctId;
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
          {(isCorrect || showExplanation) && <p className="mt-1">{question.why}</p>}
        </div>
      ) : null}
    </fieldset>
  );
}

export default function AdaptiveHaalPilot() {
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

  const content = PATH_CONTENT[path];
  const question = PRACTICE[path][practiceIndex];
  const currentAnchor = ANCHOR_FORMS[anchorFormIndex];
  const anchorReady = currentAnchor.every(item => typeof anchor[item.id] === "string");
  const anchorResult = assessAnchor(anchor, currentAnchor);

  function choosePath(chosen: LearningPath) {
    setPath(chosen);
    setPracticeIndex(0);
    setPracticeAnswer("");
    setHintCount(0);
    setConsecutiveStruggles(0);
    setConsecutiveSuccess(0);
    setOffer(null);
    setFeedbackShown(false);
    setStage("lesson");
  }

  function finishDiagnostic() {
    if (!DIAGNOSTIC.every(item => diagnostic[item.id])) return;
    const scored = assessQuestions(DIAGNOSTIC, diagnostic);
    const selection = recommendPath({
      correct: scored.correct, total: scored.total,
      hintsUsed: Object.values(diagnosticHints).filter(Boolean).length,
      errorKinds: scored.rows.filter(row => !row.correct && row.errorKind !== null).map(row => row.errorKind!).filter(Boolean),
    });
    setRecommended(selection);
    choosePath(selection);
  }

  function checkPractice() {
    if (!practiceAnswer || !question || feedbackShown) return;
    const correct = practiceAnswer === question.correctId;
    setFeedbackShown(true);
    const success = correct ? consecutiveSuccess + 1 : 0;
    const struggles = correct ? 0 : consecutiveStruggles + 1;
    setConsecutiveSuccess(success);
    setConsecutiveStruggles(struggles);
    const suggested = suggestSupport({ path, consecutiveSuccess: success, consecutiveStruggles: struggles });
    setOffer(suggested !== path ? suggested : null);
  }

  function nextPractice() {
    if (practiceIndex + 1 >= PRACTICE[path].length) {
      setStage("anchor");
      setAnchor({});
      setShowExplanation(false);
    } else {
      setPracticeIndex(index => index + 1);
      setPracticeAnswer("");
      setFeedbackShown(false);
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
              <button key={item} type="button" onClick={() => choosePath(item)}
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

        {stage === "diagnostic" && (
          <section className="space-y-4">
            <h2 className="text-xl font-extrabold">اكتشف نقطة البداية</h2>
            <p className="text-sm leading-7">أربع أسئلة قصيرة لا تُسجّل في حسابك، ولا تدخل في التقدير النهائي. يمكنك تجاوزها باختيار أي مسار أعلاه.</p>
            {DIAGNOSTIC.map(item => (
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
            <button type="button" disabled={!DIAGNOSTIC.every(item => diagnostic[item.id])} onClick={finishDiagnostic}
              className="min-h-12 w-full rounded-xl bg-[#174f47] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
              اقترح لي مسارًا مناسبًا
            </button>
          </section>
        )}

        {stage === "lesson" && (
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
              <button type="button" onClick={() => setShowTranslation(value => !value)}
                aria-expanded={showTranslation} className="mt-3 min-h-11 rounded-lg border border-[#d6c391] px-4 text-sm font-semibold">
                {showTranslation ? "إخفاء معاني الكلمات" : "مساعدة لغوية اختيارية"}
              </button>
              {showTranslation && (
                <div className="mt-2 rounded-xl bg-stone-50 p-4 text-sm leading-7">
                  <p>{content.glossary}</p>
                  <p lang="en" dir="ltr" className="mt-2 text-left">Circumstantial accusative (ḥāl): a word describing how someone or something is during an action.</p>
                  <p className="mt-1">الدعم اللغوي لا يغيّر درجة فهمك للمفهوم النحوي.</p>
                </div>
              )}
            </div>
            {question && (
              <div className="space-y-3">
                <p className="text-sm font-bold">تدريب {practiceIndex + 1} من {PRACTICE[path].length}</p>
                <QuestionCard question={question} value={practiceAnswer} onAnswer={value => {
                  if (feedbackShown) return;
                  setPracticeAnswer(value);
                }} showFeedback={feedbackShown} />
                {!feedbackShown && (
                  <button type="button" disabled={!practiceAnswer} onClick={checkPractice}
                    className="min-h-12 rounded-xl bg-[#174f47] px-5 py-3 font-bold text-white disabled:opacity-40">
                    تحقق من إجابتي
                  </button>
                )}
                {feedbackShown && practiceAnswer !== question.correctId && (
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
                        onClick={() => { setPracticeAnswer(""); setFeedbackShown(false); }}>
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
                {feedbackShown && practiceAnswer === question.correctId && (
                  <button type="button" onClick={nextPractice} className="min-h-12 rounded-xl bg-[#174f47] px-5 py-3 font-bold text-white">
                    {practiceIndex + 1 === PRACTICE[path].length ? "الاختبار المشترك لجميع المسارات" : "التدريب التالي"}
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

        {stage === "anchor" && (
          <section className="space-y-4">
            <h2 className="text-xl font-extrabold">تحقق مشترك من الهدف</h2>
            <p className="text-sm leading-7">معيار النجاح واحد لجميع المسارات: أربع إجابات صحيحة من خمس على الأقل. هذه صيغة {anchorFormIndex + 1} من {ANCHOR_FORMS.length}، بأمثلة تختلف عن الصيغة السابقة. الإعادة في الجلسة نفسها ليست تحققًا متباعدًا ولا تمنح إتقانًا نهائيًا.</p>
            {currentAnchor.map(item => (
              <QuestionCard key={item.id} question={item} value={anchor[item.id]}
                onAnswer={answer => setAnchor(current => ({ ...current, [item.id]: answer }))} showFeedback={false}/>
            ))}
            <button type="button" disabled={!anchorReady} onClick={() => setStage("results")}
              className="min-h-12 w-full rounded-xl bg-[#174f47] px-5 py-3 font-bold text-white disabled:opacity-40">
              اعرض نتيجة التحقق
            </button>
          </section>
        )}

        {stage === "results" && (
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
                showFeedback showExplanation/>
            ))}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => { setStage("lesson"); setPracticeAnswer(""); setPracticeIndex(0); setFeedbackShown(false); }}
                className="min-h-12 rounded-xl bg-[#174f47] px-5 font-bold text-white">مراجعة شرح المسار</button>
              <button type="button" onClick={() => { setAnchorFormIndex(index => (index + 1) % ANCHOR_FORMS.length); setStage("anchor"); setAnchor({}); setShowExplanation(false); }}
                className="min-h-12 rounded-xl border border-[#174f47] px-5 font-bold">أتحقق بأمثلة جديدة</button>
            </div>
          </section>
        )}

        <footer className="rounded-xl border border-[#e8debf] bg-[#fffdf3] p-4 text-xs leading-7">
          {HALL_GOAL.disclaimer} لا تُحفظ الإجابات أو مدة الاستجابة أو المسار في الخادم أو التخزين المحلي.
          الحكم الرسمي بالإتقان يحتاج ثلاث جلسات متباعدة وتقييمًا آمنًا من الخادم ومراجعة المعلم.
        </footer>
      </div>
    </main>
  );
}
