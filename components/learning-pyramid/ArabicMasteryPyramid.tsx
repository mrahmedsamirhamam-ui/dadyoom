"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LEVELS, PYRAMID_PACKS, type ChoiceTask, type CreativeTask, type PyramidPack } from "@/lib/learning-pyramid/packs";

type Feedback = { correct: boolean; message: string; explanation?: string } | null;

const EMPTY_PROGRESS = [false, false, false, false, false, false];

export default function ArabicMasteryPyramid({ customPack }: { customPack?: PyramidPack }) {
  const packs = useMemo(() => customPack ? [customPack] : PYRAMID_PACKS, [customPack]);
  const [packSlug, setPackSlug] = useState(customPack?.slug ?? PYRAMID_PACKS[0].slug);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>([...EMPTY_PROGRESS]);
  const [choice, setChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [creative, setCreative] = useState("");
  const [checks, setChecks] = useState<boolean[]>([false, false, false]);
  const [creativeError, setCreativeError] = useState("");
  const [teacherGuide, setTeacherGuide] = useState(false);

  const pack = useMemo(
    () => packs.find((item) => item.slug === packSlug) ?? packs[0],
    [packSlug, packs],
  );
  const step = pack.steps[currentIndex];
  const level = LEVELS[currentIndex];
  const completedCount = completed.filter(Boolean).length;
  const nextUnlocked = completed.findIndex((done) => !done);
  const maxUnlocked = nextUnlocked < 0 ? 5 : nextUnlocked;
  const fullyCompleted = completedCount === pack.steps.length;

  function clearInteraction() {
    setChoice(null);
    setFeedback(null);
    setShowHint(false);
    setCreativeError("");
  }

  function choosePack(slug: string) {
    if (slug === packSlug) return;
    setPackSlug(slug);
    setCurrentIndex(0);
    setCompleted([...EMPTY_PROGRESS]);
    setAttempts([0, 0, 0, 0, 0, 0]);
    setCreative("");
    setChecks([false, false, false]);
    clearInteraction();
  }

  function openLevel(index: number) {
    if (index < 0 || index > maxUnlocked) return;
    setCurrentIndex(index);
    clearInteraction();
  }

  function confirmAnswer(task: ChoiceTask) {
    if (choice === null || completed[currentIndex]) return;
    const correct = choice === task.correctIndex;
    setAttempts((prev) => prev.map((n, i) => i === currentIndex ? n + 1 : n));
    if (correct) {
      setCompleted((prev) => prev.map((value, i) => i === currentIndex ? true : value));
      setFeedback({ correct: true, message: "أحسنت! أكملت هذا المستوى ويمكنك الصعود.", explanation: task.explanation });
    } else {
      setFeedback({ correct: false, message: "محاولة جيدة. اقرأ التلميح ثم جرّب مرة أخرى." });
      setShowHint(true);
    }
  }

  function finishCreative(task: CreativeTask) {
    if (completed[currentIndex]) return;
    if (creative.trim().length < 12 || !checks.every(Boolean)) {
      setCreativeError("اكتب جملة من إنشائك (12 حرفًا على الأقل)، ثم راجع البنود الثلاثة قبل الإكمال.");
      return;
    }
    setCompleted((prev) => prev.map((value, i) => i === currentIndex ? true : value));
    setCreativeError("");
    setFeedback({
      correct: true,
      message: "أنجزت مهمة الكتابة والتقويم الذاتي. اعرض جملتك على معلمك للتأكد من صحتها.",
      explanation: task.teacherNote,
    });
  }

  function reset() {
    setCompleted([...EMPTY_PROGRESS]);
    setAttempts([0, 0, 0, 0, 0, 0]);
    setCurrentIndex(0);
    setCreative("");
    setChecks([false, false, false]);
    clearInteraction();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] text-[#243d38]">
      <div className="border-b border-[#e5d4b4] bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="font-arabic-display text-xl font-black text-[#174f47]">ضاديوم <span className="text-xs text-[#ac8032]">Dadyoom</span></Link>
          <Link href={customPack ? "/interactive-lab/pyramid/teacher" : "/interactive-lab"} className="rounded-xl border border-[#cfc2a8] px-4 py-2 text-sm font-black text-[#174f47]">← مختبر ضاديوم</Link>
        </nav>
      </div>

      <header className="bg-[#123f39] px-4 py-10 text-center text-white sm:py-14">
        <p className="text-sm font-black tracking-wide text-[#f2d68d]">مختبر ضاديوم التفاعلي</p>
        <h1 className="mt-3 font-arabic-display text-3xl font-black sm:text-5xl">هرم إتقان العربية</h1>
        <p className="mx-auto mt-3 max-w-2xl font-arabic-reading text-lg leading-8 text-[#e3efea]">من الملاحظة إلى الفهم، ومن التطبيق إلى الإبداع. اصعد ست درجات بأنشطتك، لا بالنظر إلى الشكل وحده.</p>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-[#e0d2b4] bg-white p-5" aria-labelledby="pack-title">
          <h2 id="pack-title" className="text-lg font-black">اختر رحلة لغوية</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {packs.map((item) => (
              <button key={item.slug} type="button" onClick={() => choosePack(item.slug)}
                aria-pressed={packSlug === item.slug}
                className={"rounded-xl border p-4 text-right transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174f47] " +
                  (packSlug === item.slug ? "border-[#174f47] bg-[#e8f4ed]" : "border-[#e2d6bd] bg-[#fffdf8] hover:border-[#a5bca9]")}>
                <span className="font-black">{item.title}</span>
                <span className="mt-1 block text-xs text-[#607469]">{item.stage} — {customPack ? "مسودة المعلم للتجربة" : "تجربة تدريبية أصلية"}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm leading-7 text-[#70685e]"><strong>الهدف:</strong> {pack.goal}</p>
          <p className="mt-1 text-xs leading-6 text-[#846f50]">هذه أنشطة إثرائية نموذجية، وليست تقييمًا رسميًا أو إثباتًا بمطابقة كتاب مدرسي محدد. لا تُحفظ درجاتك في سجل المدرسة.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
          <div className="rounded-[2rem] border border-[#e0d1b1] bg-white px-3 py-6 shadow-sm sm:px-6">
            <div className="flex items-center justify-between gap-3 px-2">
              <h2 className="text-lg font-black">درجات الهرم</h2>
              <span className="rounded-full bg-[#eef5ef] px-3 py-1 text-xs font-black text-[#174f47]">{completedCount} من 6 مكتملة</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f2ead8]" role="progressbar" aria-valuenow={completedCount} aria-valuemin={0} aria-valuemax={6} aria-label="مستويات تم إكمالها">
              <div className="h-full rounded-full bg-[#1b745b] transition-all" style={{ width: String(completedCount / 6 * 100) + "%" }} />
            </div>
            <p className="mt-4 px-2 text-xs leading-6 text-[#776e61]">ابدأ من قاعدة الهرم «اكتشف»، ثم اصعد حتى «أبدع». اضغط المستوى الحالي أو أي مستوى أنهيته للمراجعة.</p>

            <div className="mt-4 flex flex-col items-center gap-1" aria-label="هرم المستويات الستة">
              {[5, 4, 3, 2, 1, 0].map((idx) => {
                const stepLevel = LEVELS[idx];
                const locked = idx > maxUnlocked;
                const done = completed[idx];
                const active = currentIndex === idx;
                const width = 39 + (5 - idx) * 12;
                return (
                  <button key={stepLevel.id} type="button"
                    disabled={locked} onClick={() => openLevel(idx)}
                    aria-label={"المستوى " + (idx + 1) + ": " + stepLevel.title + (locked ? "، مقفل" : done ? "، مكتمل" : "، متاح")}
                    aria-current={active ? "step" : undefined}
                    className={"group flex min-h-[68px] flex-col items-center justify-center px-4 py-3 text-center text-white transition-transform focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#b58b42] sm:min-h-[74px] " +
                      (locked ? "cursor-not-allowed grayscale opacity-45" : "hover:scale-[1.03] active:scale-[.98]") +
                      (active ? " ring-4 ring-[#f0c56b] ring-offset-2" : "")}
                    style={{
                      width: String(width) + "%",
                      background: "linear-gradient(125deg," + stepLevel.color + ", #123f39)",
                      clipPath: "polygon(11% 0,89% 0,100% 100%,0 100%)",
                      borderRadius: "10px",
                    }}>
                    <span className="text-xl" aria-hidden="true">{done ? "✅" : locked ? "🔒" : stepLevel.icon}</span>
                    <span className="text-sm font-black sm:text-base">{stepLevel.title}</span>
                  </button>
                );
              })}
            </div>

            {fullyCompleted && <p role="status" className="mt-5 rounded-2xl bg-[#e8f5ea] p-4 text-center text-sm font-black text-[#17553b]">🎉 وصلت إلى قمة هرم التدريب! كتابة جملتك تحتاج إلى مراجعة المعلم قبل الحكم على الإتقان.</p>}
          </div>

          <section className="rounded-[2rem] border border-[#dfd0b3] bg-[#fffef9] p-5 shadow-sm sm:p-8" aria-labelledby="question-heading">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black text-white" style={{ backgroundColor: level.color }}>
              <span aria-hidden="true">{level.icon}</span> المستوى {currentIndex + 1} من 6: {level.title}
            </div>
            <h2 id="question-heading" className="mt-5 font-arabic-display text-2xl font-black">{step.title}</h2>
            <p className="mt-2 text-sm leading-7 text-[#6c6559]">{step.purpose}</p>
            <div className="mt-5 rounded-2xl border border-[#e7d9b9] bg-[#fdf5e4] px-5 py-4 font-arabic-reading text-base leading-8">
              <strong>فكّر:</strong> {pack.intro}
            </div>

            <h3 className="mt-6 font-arabic-reading text-lg font-black leading-9">{step.task.question}</h3>

            {step.task.kind === "choice" ? (
              <div className="mt-4 space-y-3" role="radiogroup" aria-label="اختر الإجابة">
                {step.task.options.map((option, optionIndex) => (
                  <button key={option} type="button" role="radio" aria-checked={choice === optionIndex}
                    disabled={completed[currentIndex]}
                    onClick={() => { setChoice(optionIndex); if (!completed[currentIndex]) { setFeedback(null); } }}
                    className={"flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-right text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174f47] " +
                      (choice === optionIndex ? "border-[#176853] bg-[#eaf4ee]" : "border-[#e0d7c7] bg-white hover:border-[#a7baab]")}>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#cabda8]">{optionIndex + 1}</span>
                    {option}
                  </button>
                ))}
                {!completed[currentIndex] && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button type="button" disabled={choice === null} onClick={() => confirmAnswer(step.task as ChoiceTask)}
                      className="rounded-xl bg-[#174f47] px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">تحقق من إجابتي</button>
                    <button type="button" onClick={() => setShowHint(!showHint)}
                      className="rounded-xl border border-[#cdbb9b] px-5 py-3 text-sm font-black text-[#745a2f]">{showHint ? "إخفاء التلميح" : "أحتاج إلى تلميح"}</button>
                  </div>
                )}
                {showHint && !completed[currentIndex] && <p className="rounded-xl bg-[#f9efd8] p-3 text-sm leading-7 text-[#6b552b]">💡 {step.task.hint}</p>}
                {attempts[currentIndex] > 0 && <p className="text-xs text-[#827665]">المحاولات في هذا المستوى: {attempts[currentIndex]}</p>}
              </div>
            ) : (
              <div className="mt-4">
                <p className="rounded-xl bg-[#f2f6f2] p-3 text-sm text-[#557066]">{step.task.example}</p>
                <label className="mt-4 block text-sm font-black" htmlFor="creative-sentence">جملتي من إنشائي</label>
                <textarea id="creative-sentence" value={creative} onChange={(event) => { setCreative(event.target.value); setCreativeError(""); }}
                  disabled={completed[currentIndex]}
                  rows={4} maxLength={350}
                  className="mt-2 w-full resize-y rounded-xl border border-[#d8cbb4] bg-white p-4 font-arabic-reading text-base leading-8 focus:border-[#174f47] focus:outline-none focus:ring-2 focus:ring-[#174f47]/20"
                  placeholder="اكتب جملتك هنا..." />
                <p className="mt-1 text-xs text-[#8c7961]">{creative.length} / 350 حرفًا</p>
                <fieldset className="mt-4 space-y-3">
                  <legend className="font-black">راجع كتابتك بنفسك</legend>
                  {step.task.criteria.map((item, index) => (
                    <label key={item} className="flex items-start gap-3 rounded-xl border border-[#e1d7c3] bg-white p-3 text-sm leading-7">
                      <input type="checkbox" checked={checks[index]} disabled={completed[currentIndex]}
                        onChange={(event) => setChecks((old) => old.map((value, i) => i === index ? event.target.checked : value))}
                        className="mt-1.5 h-4 w-4 accent-[#174f47]" />
                      <span>{item}</span>
                    </label>
                  ))}
                </fieldset>
                {creativeError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{creativeError}</p>}
                {!completed[currentIndex] && (
                  <button type="button" onClick={() => finishCreative(step.task as CreativeTask)}
                    className="mt-5 rounded-xl bg-[#174f47] px-6 py-3 text-sm font-black text-white">أكملت مراجعتي الذاتية</button>
                )}
                <p className="mt-3 text-xs leading-6 text-[#826e52]">هذا تدريب كتابي حرّ بلا تصحيح آلي؛ لا تُعدّ علامة المراجعة الذاتية دليلًا على صحة الجملة.</p>
              </div>
            )}

            {feedback && (
              <div aria-live="polite" role="status" className={"mt-5 rounded-xl border p-4 text-sm leading-8 " +
                (feedback.correct ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900")}>
                <p className="font-black">{feedback.correct ? "✅" : "🌱"} {feedback.message}</p>
                {feedback.explanation && <p className="mt-2">{feedback.explanation}</p>}
              </div>
            )}

            {completed[currentIndex] && currentIndex < 5 && (
              <button type="button" onClick={() => openLevel(currentIndex + 1)}
                className="mt-5 w-full rounded-xl bg-[#174f47] px-5 py-3.5 font-black text-white">اصعد إلى مستوى «{LEVELS[currentIndex + 1].title}» ↑</button>
            )}
            {fullyCompleted && (
              <div className="mt-5 rounded-2xl border border-[#c6d9c8] bg-[#e8f3e9] p-4">
                <h3 className="text-lg font-black">نتيجة رحلة التدريب</h3>
                <p className="mt-2 text-sm leading-7">أكملت مستويات الهرم الستة في موضوع «{pack.title}»، منها مهمة كتابة ذات تقويم ذاتي. هذا ليس اختبارًا معياريًا أو شهادة إتقان.</p>
                <button type="button" onClick={reset} className="mt-3 rounded-xl border border-[#8dac94] bg-white px-4 py-2 text-sm font-black">ابدأ الرحلة من جديد</button>
              </div>
            )}
          </section>
        </section>

        <section className="rounded-2xl border border-[#e4d6ba] bg-white p-5 sm:p-6">
          <button type="button" onClick={() => setTeacherGuide((value) => !value)}
            aria-expanded={teacherGuide} aria-controls="teacher-guide"
            className="flex w-full items-center justify-between gap-3 text-right text-lg font-black">
            <span>📘 للمعلم: دليل استخدام الهرم</span><span aria-hidden="true">{teacherGuide ? "−" : "+"}</span>
          </button>
          {teacherGuide && <div id="teacher-guide" className="mt-4 space-y-3 text-sm leading-8 text-[#52665b]">
            <p>نستخدم مستويات التفكير في أسئلة متدرجة: ملاحظة ← فهم ← تطبيق ← تحليل ← تقويم ← إنتاج. ليست الدرجات حكمًا نهائيًا على مستوى المتعلم.</p>
            <p>يمكن للمعلم عرض الهرم جماعيًا، ثم مناقشة سبب الإجابة الصحيحة وفحص نص الطالب في المرحلة الأخيرة. تُسجّل الملاحظات التربوية داخل أدوات المعلم المعتمدة فقط.</p>
            <p>الحزم الحالية من تأليف ضاديوم لأغراض التدريب، وليست مطابقة تلقائيًا لدرس مقرر بعينه. يلزم اعتماد تربوي ومطابقة موثقة قبل إدراج أنشطة الهرم ضمن أي منهج رسمي.</p>
          </div>}
        </section>
      </div>
    </main>
  );
}
