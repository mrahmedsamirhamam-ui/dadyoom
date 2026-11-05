"use client";

import { useMemo, useState } from "react";
import StructuredLessonText from "@/components/lesson/StructuredLessonText";
import {
  listPublishedGoalChoices,
  READING_PATHS,
  splitPublishedLessonIntoSteps,
  type ReadingPath,
} from "@/lib/adaptive-goal-paths/grounded-lesson-reading.mjs";

type Props = {
  lessonTitle: string;
  content: string | null | undefined;
  objectives: string[];
};

/**
 * Enhances the actual published lesson without replacing or rewriting it.
 * These are reading/scaffolding preferences, NOT graded learning levels.
 * No Supabase request, inferred diagnosis, browser storage, or answer keys.
 */
export default function LessonExplanationPaths({ lessonTitle, content, objectives }: Props) {
  // Show the full published text by default for accessibility and search indexing.
  // The learner may switch to a small-step or challenge view at any time.
  const [path, setPath] = useState<ReadingPath>("progress");
  const [goalIndex, setGoalIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [reflection, setReflection] = useState("");
  const [showSelfCheck, setShowSelfCheck] = useState(false);
  const [speechNotice, setSpeechNotice] = useState("");

  const steps = useMemo(() => splitPublishedLessonIntoSteps(content), [content]);
  const goals = useMemo(() => listPublishedGoalChoices(objectives), [objectives]);
  const selectedGoal = goals[Math.min(goalIndex, Math.max(0, goals.length - 1))] ?? null;
  const currentStep = Math.min(step, Math.max(0, steps.length - 1));
  const originalContentAvailable = typeof content === "string" && content.trim().length > 0;

  function changePath(next: ReadingPath) {
    setPath(next);
    setStep(0);
    setReflection("");
    setShowSelfCheck(false);
    setSpeechNotice("");
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  function readStepAloud() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechNotice("القراءة الصوتية غير متاحة في هذا المتصفح؛ يمكنك متابعة النص المعروض.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(steps[currentStep] ?? "");
    utterance.lang = "ar";
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeechNotice("بدأت القراءة الصوتية إن كان الصوت العربي متاحًا على جهازك.");
  }

  if (!originalContentAvailable) {
    return <StructuredLessonText content={content} />;
  }

  return (
    <section id="lesson-reading-paths" dir="rtl" aria-labelledby="lesson-reading-paths-title"
      className="space-y-5">
      <div className="lesson-arabic-card space-y-4 rounded-3xl border border-[#dce9df] bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-black text-[#59786e]">شرح موضوع الدرس المنشور نفسه</p>
        <h2 id="lesson-reading-paths-title"
          className="font-arabic-display text-2xl font-black leading-tight text-[#173f38] sm:text-3xl">
          اختر الطريقة التي تريحك لفهم «{lessonTitle}»
        </h2>
        <p className="text-sm leading-8 text-[#4b6559]">
          المحتوى واحد في المسارات الثلاثة؛ نغيّر طريقة عرضه والدعم فقط.
          لا توجد مقارنة بين الطلاب، ويمكنك تغيير الطريقة في أي وقت.
        </p>

        {goals.length > 0 ? (
          <div className="rounded-2xl border border-[#e1e9dd] bg-[#f6faf5] p-4">
            <label htmlFor="lesson-learning-goal" className="block text-sm font-bold">
              أركز الآن على هدف واحد من أهداف هذا الدرس
            </label>
            <select id="lesson-learning-goal" value={String(Math.min(goalIndex, goals.length - 1))}
              onChange={event => { setGoalIndex(Number(event.target.value)); setReflection(""); setShowSelfCheck(false); }}
              className="mt-2 min-h-12 w-full rounded-xl border border-[#abc7b3] bg-white px-3 py-2 text-sm leading-6">
              {goals.map((goal, index) => <option key={index} value={index}>{goal}</option>)}
            </select>
            <p className="mt-2 text-sm leading-7 text-[#3e584d]">
              هذا الهدف مأخوذ من سجل الدرس المنشور، ولا يتغير عند اختيار طريقة الشرح.
            </p>
          </div>
        ) : (
          <p className="rounded-xl bg-amber-50 p-4 text-sm leading-7 text-amber-900">
            لم يُسجَّل هدف تعلم محدد لهذا الدرس؛ يمكنك قراءة الشرح بطرق مختلفة،
            لكن لا يمكن اعتبار هذا تخصيصًا معتمدًا لهدف لم يُوثّق.
          </p>
        )}

        <div role="group" aria-label="مسارات عرض الشرح" className="grid gap-3 sm:grid-cols-3">
          {READING_PATHS.map(choice => (
            <button key={choice.id} type="button" onClick={() => changePath(choice.id)}
              aria-pressed={path === choice.id}
              className={"min-h-[92px] rounded-2xl border-2 px-4 py-3 text-right transition focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad59] " +
                (path === choice.id
                  ? "border-[#17665b] bg-[#eaf6ef] text-[#173f38]"
                  : "border-[#dfe7df] bg-white text-[#49675a] hover:border-[#88aa95]")}>
              <span className="block text-base font-extrabold">{choice.title}</span>
              <span className="mt-1 block text-xs leading-6">{choice.hint}</span>
            </button>
          ))}
        </div>
        <p className="text-xs leading-7 text-[#587568]">
          هذه أدوات مساندة للقراءة وليست اختبارًا تشخيصيًا أو درجة إتقان.
          النص الأصلي متاح كاملًا دائمًا، والتقييم الرسمي يبقى في قسم الأسئلة بعد الشرح.
        </p>
      </div>

      {path === "start" ? (
        <article className="lesson-arabic-card rounded-3xl border border-[#dce9df] bg-white p-5 shadow-sm sm:p-8"
          aria-labelledby="lesson-small-step-title">
          <p className="text-sm font-bold text-[#59786e]">مسار البداية • أقرأ جزءًا ثم أنتقل إلى التالي</p>
          <h3 id="lesson-small-step-title" className="mt-2 text-xl font-extrabold text-[#173f38]">
            جزء {currentStep + 1} من {steps.length}
          </h3>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8efe9]"
            role="progressbar" aria-label="تقدم قراءة أجزاء الشرح" aria-valuemin={0}
            aria-valuemax={steps.length} aria-valuenow={currentStep + 1}>
            <div className="h-full rounded-full bg-[#17665b]"
              style={{ width: (((currentStep + 1) / steps.length) * 100) + "%" }} />
          </div>
          <div aria-live="polite"
            className="mt-5 whitespace-pre-wrap break-words rounded-2xl bg-[#f7faf7] p-5 text-lg leading-10 text-[#304a3e]">
            {steps[currentStep]}
          </div>
          <details className="mt-4 rounded-xl border border-[#c7d6ca] p-4 text-sm leading-7">
            <summary className="cursor-pointer font-bold">مساعدة لفهم هذا الجزء</summary>
            <p className="mt-2">اقرأ المقطع مرة أخرى. ما الفكرة الواردة فيه؟ وما الكلمة أو الحدث الذي يساعدك على فهمها؟</p>
            {selectedGoal && <p className="mt-2"><strong>هدفي الآن: </strong>{selectedGoal}</p>}
          </details>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(i => Math.max(0, i - 1))}
              disabled={currentStep === 0}
              className="min-h-12 rounded-xl border border-[#17665b] px-5 font-bold disabled:cursor-not-allowed disabled:opacity-40">
              السابق
            </button>
            <button type="button" onClick={() => setStep(i => Math.min(steps.length - 1, i + 1))}
              disabled={currentStep === steps.length - 1}
              className="min-h-12 rounded-xl bg-[#174f47] px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
              الجزء التالي
            </button>
            <button type="button" onClick={readStepAloud}
              className="min-h-12 rounded-xl border border-[#17665b] px-5 font-bold">
              استمع لهذا الجزء
            </button>
          </div>
          {speechNotice && <p role="status" className="mt-3 text-sm leading-7">{speechNotice}</p>}
          <button type="button" onClick={() => changePath("progress")}
            className="mt-4 min-h-11 text-sm font-bold text-[#17665b] underline underline-offset-4">
            أريد قراءة الشرح كاملًا بنفس ترتيبه
          </button>
        </article>
      ) : path === "progress" ? (
        <div aria-label="الشرح الأصلي كاملًا مع التركيز على الهدف">
          {selectedGoal && (
            <p className="mb-3 rounded-xl bg-[#eaf6ef] p-4 text-sm leading-7 text-[#173f38]">
              أثناء القراءة، ابحث عن فكرة أو مثال يساعدك على تحقيق هذا الهدف: <strong>{selectedGoal}</strong>
            </p>
          )}
          <StructuredLessonText content={content} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#dce9df] bg-white p-5 sm:p-8">
            <h3 className="text-xl font-extrabold text-[#173f38]">أحلّل وأستدل من الدرس</h3>
            <p className="mt-3 text-sm leading-8">
              {selectedGoal ? <>ما الدليل من شرح الدرس على تحقق الهدف: <strong>{selectedGoal}</strong>؟</> :
                "حدد فكرة رئيسية من الشرح، ثم استشهد بتفصيل وارد فيه. لا تضف وقائع لم يذكرها النص."}
            </p>
            <p className="mt-2 text-sm leading-7">استعن بالنص المنشور أسفل هذه المهمة، وعبّر عن استنتاجك بكلماتك.</p>
            <label htmlFor="lesson-reflection" className="mt-4 block text-sm font-bold">ملاحظتي وتحليلي (اختياري)</label>
            <textarea id="lesson-reflection" value={reflection}
              onChange={event => { setReflection(event.target.value); setShowSelfCheck(false); }}
              rows={4} maxLength={1800} placeholder="أكتب الدليل من الدرس، ثم أشرح كيف يدعم استنتاجي..."
              className="mt-2 min-h-32 w-full rounded-xl border border-[#aac4b2] bg-[#f7faf7] p-4 text-sm leading-7" />
            <button type="button" onClick={() => setShowSelfCheck(value => !value)}
              className="mt-3 min-h-11 rounded-xl border border-[#17665b] px-4 text-sm font-bold"
              aria-expanded={showSelfCheck}>
              {showSelfCheck ? "إخفاء معايير المراجعة" : "أراجع كتابتي بنفسي"}
            </button>
            {showSelfCheck && (
              <div className="mt-3 rounded-xl bg-[#f2f7f3] p-4 text-sm leading-8">
                <p>راجع: هل استخدمت شاهدًا حقيقيًا من الدرس؟ وهل شرحت علاقته بالفكرة أو الهدف المختار؟</p>
                <p className="mt-1">هذه مراجعة ذاتية فقط؛ لم تُصحّح كتابتك آليًا ولا تُحتسب درجة.</p>
              </div>
            )}
          </div>
          <StructuredLessonText content={content} />
        </div>
      )}
    </section>
  );
}
