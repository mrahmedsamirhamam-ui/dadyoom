"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DadAI, DadVoice, type DadState } from "@/services/dad-ai";

type VocabularyItem = {
  word: string;
  meaning: string;
  example: string;
};

type ActivityItem = {
  title: string;
  instructions: string;
};

type AssessmentItem = {
  question: string;
  answer: string;
};

type GradingResult = {
  correct: boolean;
  score: number;
  feedback: string;
  teacherComment: string;
  skill: string;
  mistakeCategory: string | null;
  difficulty: "سهل" | "متوسط" | "صعب";
  recommendation: string;
  strengths: string[];
  mistakes: string[];
};

type Lesson = {
  id: string;
  title: string;
  skill: string;
  difficultyLevel: string;
  estimatedMinutes: number;
  points: number;
  objectives: string[];
  introduction: string;
  explanation: string;
  vocabulary: VocabularyItem[];
  activities: ActivityItem[];
  assessment: AssessmentItem[];
  homework: string;
  nextLessonId?: string | null;
};

type LessonViewProps = {
  lesson: Lesson;
};

type SmartGradingResponse = {
  success: boolean;
  results?: GradingResult[];
  message?: string;
  error?: string;
};

type CompleteLessonResponse = {
  success: boolean;
  earnedPoints?: number;
  nextLessonId?: string | null;
  message?: string;
  error?: string;
};

const skillLabels: Record<string, string> = {
  reading: "القراءة",
  writing: "الكتابة",
  listening: "الاستماع",
  speaking: "التحدث",
  grammar: "القواعد",
  vocabulary: "المفردات",
  general: "مهارات اللغة العربية",
};

const difficultyLabels: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

export default function LessonView({ lesson }: LessonViewProps) {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [gradingResults, setGradingResults] = useState<
    Record<number, GradingResult>
  >({});
  const [isChecked, setIsChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState("");

  const [isCompleting, setIsCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const [completionError, setCompletionError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [nextLessonId, setNextLessonId] = useState<string | null>(
    lesson.nextLessonId ?? null
  );

  // حالة المكون المرئية لـ "ضاد"
  const [, setDadVisualState] = useState<DadState>("idle");

  const gradingResultValues = Object.values(gradingResults);

  const score = gradingResultValues.filter((result) => result.correct).length;

  const percentage =
    lesson.assessment.length > 0
      ? Math.round(
          gradingResultValues.reduce(
            (total, result) => total + result.score,
            0
          ) / lesson.assessment.length
        )
      : 100;

  async function checkAnswers() {
    const unansweredQuestion = lesson.assessment.findIndex(
      (_, index) => !(answers[index] ?? "").trim()
    );

    if (unansweredQuestion !== -1) {
      setCheckError(`اكتب إجابة السؤال رقم ${unansweredQuestion + 1} أولًا.`);
      return;
    }

    try {
      setIsChecking(true);
      DadAI.think();
      setDadVisualState("thinking");

      // إطلاق الصوت في الخلفية دون تعطيل أو انتظار طلب التصحيح
      void DadVoice.speak("دعني أفكر قليلًا في إجابتك.", {
        mood: "thinking",
      }).catch((error) => {
        console.error("Thinking voice error:", error);
      });

      setCheckError("");
      setCompletionError("");
      setIsChecked(false);
      setGradingResults({});

      const response = await fetch("/api/assessments/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId: lesson.id,
          items: lesson.assessment.map((item, index) => ({
            question: item.question,
            modelAnswer: item.answer,
            studentAnswer: answers[index] ?? "",
          })),
        }),
      });

      const result = (await response.json()) as SmartGradingResponse;

      if (!response.ok || !result.success || !result.results) {
        throw new Error(
          result.message || result.error || "تعذر تصحيح الإجابات."
        );
      }

      const nextResults: Record<number, GradingResult> = {};

      result.results.forEach((item, index) => {
        nextResults[index] = item;
      });

      setGradingResults(nextResults);
      setIsChecked(true);

      const allCorrect = result.results.every((item) => item.correct);
      if (allCorrect) {
        DadAI.correct();
        setDadVisualState("correct");

        await DadVoice.speak(
          "يا سلام عليك! إجابتك صحيحة. أحسنت يا بطل.",
          {
            mood: "correct",
          }
        );

        window.setTimeout(() => {
          DadAI.idle();
          setDadVisualState("idle");
        }, 2500);
      } else {
        DadAI.encourage();
        setDadVisualState("encouraging");

        await DadVoice.speak(
          "أنت قريب جدًا من الإجابة. راجع الفكرة، وحاول مرة أخرى.",
          {
            mood: "encouraging",
          }
        );

        window.setTimeout(() => {
          DadAI.idle();
          setDadVisualState("idle");
        }, 2500);
      }
    } catch (error) {
      DadAI.error();
      setDadVisualState("error");

      window.setTimeout(() => {
        DadAI.idle();
        setDadVisualState("idle");
      }, 2500);

      setCheckError(
        error instanceof Error ? error.message : "حدث خطأ أثناء تصحيح الإجابات."
      );
    } finally {
      setIsChecking(false);
    }
  }

  async function completeLesson() {
    if (isCompleting || completed) {
      return;
    }

    if (lesson.assessment.length > 0 && !isChecked) {
      setCompletionError(
        "أجب عن أسئلة التقويم واضغط «تحقق من الإجابات» قبل إكمال الدرس."
      );
      return;
    }

    try {
      setIsCompleting(true);
      setCompletionError("");
      setCompletionMessage("");

      const response = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId: lesson.id,
          score: percentage,
        }),
      });

      const result = (await response.json()) as CompleteLessonResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || result.error || "تعذر تسجيل إكمال الدرس."
        );
      }

      const earnedPoints = result.earnedPoints ?? lesson.points;

      setCompleted(true);
      setNextLessonId(result.nextLessonId ?? lesson.nextLessonId ?? null);
      setCompletionMessage(
        `أحسنت! تم إكمال الدرس وحصلت على ${earnedPoints} نقطة.`
      );

      DadAI.celebrate();
      setDadVisualState("celebrating");

      await DadVoice.speak(
        "رائع يا بطل! لقد أنهيت الدرس بنجاح، وحققت تقدمًا جديدًا.",
        {
          mood: "celebrating",
        }
      );

      window.setTimeout(() => {
        DadAI.idle();
        setDadVisualState("idle");
      }, 3000);

      setShowSuccessModal(true);

      router.refresh();
    } catch (error) {
      setCompletionError(
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء إكمال الدرس."
      );
    } finally {
      setIsCompleting(false);
    }
  }

  const totalAssessmentScore =
    gradingResultValues.length > 0
      ? Math.round(
          gradingResultValues.reduce(
            (total, result) => total + result.score,
            0
          ) / gradingResultValues.length
        )
      : 0;

  const allStrengths = Array.from(
    new Set(gradingResultValues.flatMap((result) => result.strengths ?? []))
  ).slice(0, 8);

  const allMistakes = Array.from(
    new Set(gradingResultValues.flatMap((result) => result.mistakes ?? []))
  ).slice(0, 8);

  const teacherComments = Array.from(
    new Set(
      gradingResultValues
        .map((result) => result.teacherComment)
        .filter(Boolean)
    )
  ).slice(0, 4);

  const recommendations = Array.from(
    new Set(
      gradingResultValues
        .map((result) => result.recommendation)
        .filter(Boolean)
    )
  ).slice(0, 4);

  const hasLessonContent =
    lesson.objectives.length > 0 ||
    Boolean(lesson.introduction) ||
    Boolean(lesson.explanation) ||
    lesson.vocabulary.length > 0 ||
    lesson.activities.length > 0 ||
    lesson.assessment.length > 0 ||
    Boolean(lesson.homework);

  return (
    <main
      dir="rtl"
      className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
    >
      <header className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
              {skillLabels[lesson.skill] ?? lesson.skill}
            </span>

            <span className="rounded-full bg-muted px-3 py-1">
              المستوى:{" "}
              {difficultyLabels[lesson.difficultyLevel] ??
                lesson.difficultyLevel}
            </span>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-primary">
              ضاديوم · بيت العربية الرقمي
            </p>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              {lesson.title}
            </h1>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-background p-4">
              <p className="text-sm text-muted-foreground">مدة الدرس</p>
              <p className="mt-1 text-lg font-bold">
                ⏱️ {lesson.estimatedMinutes} دقيقة
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-4">
              <p className="text-sm text-muted-foreground">نقاط الدرس</p>
              <p className="mt-1 text-lg font-bold">
                ⭐ {lesson.points} نقطة
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-4">
              <p className="text-sm text-muted-foreground">عدد الأنشطة</p>
              <p className="mt-1 text-lg font-bold">
                🎮 {lesson.activities.length} نشاط
              </p>
            </div>
          </div>
        </div>
      </header>

      {!hasLessonContent ? (
        <section className="rounded-3xl border border-amber-300 bg-amber-50 p-6 text-center shadow-sm sm:p-8">
          <div className="text-4xl">📭</div>
          <h2 className="mt-3 text-2xl font-black text-amber-950">
            محتوى الدرس غير محفوظ بعد
          </h2>
          <p className="mx-auto mt-3 max-w-2xl leading-8 text-amber-900">
            صفحة الدرس تعمل بصورة صحيحة، لكن حقول المحتوى في قاعدة البيانات
            فارغة. افتح الدرس من لوحة الإدارة، ولّد المحتوى بالذكاء الاصطناعي،
            ثم احفظ الدرس مرة أخرى.
          </p>
        </section>
      ) : null}

      {lesson.objectives.length > 0 ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">🎯 أهداف الدرس</h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {lesson.objectives.map((objective, index) => (
              <div
                key={`${objective}-${index}`}
                className="flex gap-3 rounded-2xl border bg-background p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <p className="leading-7">{objective}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {lesson.introduction ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">💡 تمهيد الدرس</h2>
          <p className="mt-5 whitespace-pre-wrap text-lg leading-9">
            {lesson.introduction}
          </p>
        </section>
      ) : null}

      {lesson.explanation ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black">📖 شرح الدرس</h2>

            <Button type="button" variant="outline" disabled>
              🤖 اشرح لي — قريبًا
            </Button>
          </div>

          <p className="mt-5 whitespace-pre-wrap text-lg leading-10">
            {lesson.explanation}
          </p>
        </section>
      ) : null}

      {lesson.vocabulary.length > 0 ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">📘 مفردات الدرس</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {lesson.vocabulary.map((item, index) => (
              <article
                key={`${item.word}-${index}`}
                className="rounded-2xl border bg-background p-5"
              >
                <h3 className="text-xl font-black text-primary">
                  {item.word || `مفردة ${index + 1}`}
                </h3>

                {item.meaning ? (
                  <p className="mt-3 leading-8">
                    <strong>المعنى:</strong> {item.meaning}
                  </p>
                ) : null}

                {item.example ? (
                  <p className="mt-2 leading-8 text-muted-foreground">
                    <strong>مثال:</strong> {item.example}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {lesson.activities.length > 0 ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">🎮 أنشطة الدرس</h2>

          <div className="mt-5 space-y-4">
            {lesson.activities.map((activity, index) => (
              <article
                key={`${activity.title}-${index}`}
                className="rounded-2xl border bg-background p-5"
              >
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                    {index + 1}
                  </span>

                  <div>
                    <h3 className="text-lg font-black">
                      {activity.title || `النشاط ${index + 1}`}
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap leading-8 text-muted-foreground">
                      {activity.instructions}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {lesson.assessment.length > 0 ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">❓ تقويم الدرس</h2>

          <p className="mt-2 text-muted-foreground">
            أجب عن الأسئلة ثم اضغط «تحقق من الإجابات».
          </p>

          <div className="mt-6 space-y-5">
            {lesson.assessment.map((item, index) => {
              const userAnswer = answers[index] ?? "";
              const gradingResult = gradingResults[index];

              return (
                <div
                  key={`${item.question}-${index}`}
                  className="rounded-2xl border bg-background p-5"
                >
                  <label
                    htmlFor={`answer-${index}`}
                    className="block font-bold leading-8"
                  >
                    {index + 1}. {item.question}
                  </label>

                  <input
                    id={`answer-${index}`}
                    value={userAnswer}
                    onChange={(event) => {
                      setAnswers((current) => ({
                        ...current,
                        [index]: event.target.value,
                      }));
                      setIsChecked(false);
                      setGradingResults({});
                      setCheckError("");
                      setCompletionError("");
                    }}
                    className="mt-4 h-12 w-full rounded-xl border bg-background px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="اكتب إجابتك هنا"
                  />

                  {isChecked && gradingResult ? (
                    <div
                      className={`mt-3 rounded-2xl border p-4 text-sm ${
                        gradingResult.correct
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-rose-200 bg-rose-50 text-rose-800"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-black">
                          {gradingResult.correct
                            ? "إجابة صحيحة ✓"
                            : "الإجابة تحتاج إلى مراجعة"}
                        </p>

                        <span className="rounded-full bg-white px-3 py-1 font-black shadow-sm">
                          {gradingResult.score}٪
                        </span>
                      </div>

                      <p className="mt-3 leading-7">
                        {gradingResult.feedback}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-white/80 p-3">
                          <p className="text-xs text-slate-500">المهارة</p>
                          <p className="mt-1 font-bold text-slate-900">
                            {gradingResult.skill}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/80 p-3">
                          <p className="text-xs text-slate-500">
                            مستوى السؤال
                          </p>
                          <p className="mt-1 font-bold text-slate-900">
                            {gradingResult.difficulty}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/80 p-3">
                          <p className="text-xs text-slate-500">نوع الخطأ</p>
                          <p className="mt-1 font-bold text-slate-900">
                            {gradingResult.mistakeCategory ??
                              "لا يوجد خطأ واضح"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl bg-white/80 p-3 text-slate-800">
                        <p className="font-bold">تعليق المعلم</p>
                        <p className="mt-1 leading-7">
                          {gradingResult.teacherComment}
                        </p>
                      </div>

                      {!gradingResult.correct ? (
                        <div className="mt-3 rounded-xl bg-white/80 p-3 text-slate-800">
                          <p className="font-bold">الإجابة النموذجية</p>
                          <p className="mt-1 leading-7">{item.answer}</p>
                        </div>
                      ) : null}

                      {gradingResult.recommendation ? (
                        <div className="mt-3 rounded-xl bg-white/80 p-3 text-slate-800">
                          <p className="font-bold">التوصية</p>
                          <p className="mt-1 leading-7">
                            {gradingResult.recommendation}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {checkError ? (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive"
            >
              {checkError}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              disabled={isChecking}
              onClick={checkAnswers}
            >
              {isChecking ? "جارٍ التصحيح الذكي..." : "تحقق من الإجابات"}
            </Button>

            {isChecked ? (
              <div className="rounded-2xl border bg-background px-5 py-3 font-bold">
                النتيجة: {score} من {lesson.assessment.length} ({percentage}٪)
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {isChecked && gradingResultValues.length > 0 ? (
        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="bg-gradient-to-l from-teal-700 to-teal-600 p-6 text-white sm:p-8">
            <p className="text-sm font-bold text-teal-100">
              تقرير ضاديوم الذكي
            </p>

            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-black">نتيجة التقييم</h2>
                <p className="mt-2 text-teal-100">
                  تقرير مختصر يوضح مستوى أدائك وما تحتاج إلى مراجعته.
                </p>
              </div>

              <div className="rounded-2xl bg-white/15 px-6 py-4 text-center backdrop-blur">
                <p className="text-sm text-teal-100">الدرجة الإجمالية</p>
                <p className="mt-1 text-4xl font-black">
                  {totalAssessmentScore}٪
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="text-lg font-black text-emerald-900">
                ✅ نقاط القوة
              </h3>

              {allStrengths.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {allStrengths.map((strength, index) => (
                    <li
                      key={`${strength}-${index}`}
                      className="flex gap-2 leading-7 text-emerald-800"
                    >
                      <span>•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 leading-7 text-emerald-800">
                  واصلت الإجابة وأكملت التقويم بنجاح.
                </p>
              )}
            </article>

            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-lg font-black text-amber-900">
                🔍 نقاط تحتاج إلى مراجعة
              </h3>

              {allMistakes.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {allMistakes.map((mistake, index) => (
                    <li
                      key={`${mistake}-${index}`}
                      className="flex gap-2 leading-7 text-amber-800"
                    >
                      <span>•</span>
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 leading-7 text-amber-800">
                  لم تظهر أخطاء متكررة في هذا التقويم.
                </p>
              )}
            </article>

            <article className="rounded-2xl border bg-background p-5">
              <h3 className="text-lg font-black">👨‍🏫 تعليق المعلم</h3>

              <div className="mt-4 space-y-3">
                {teacherComments.map((comment, index) => (
                  <p
                    key={`${comment}-${index}`}
                    className="rounded-xl bg-muted p-4 leading-8"
                  >
                    {comment}
                  </p>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border bg-background p-5">
              <h3 className="text-lg font-black">🚀 الخطوة التالية</h3>

              <div className="mt-4 space-y-3">
                {recommendations.map((recommendation, index) => (
                  <p
                    key={`${recommendation}-${index}`}
                    className="rounded-xl bg-primary/5 p-4 leading-8"
                  >
                    {recommendation}
                  </p>
                ))}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {lesson.homework ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">📝 الواجب المنزلي</h2>
          <p className="mt-5 whitespace-pre-wrap text-lg leading-9">
            {lesson.homework}
          </p>
        </section>
      ) : null}

      <section className="rounded-3xl border bg-primary/5 p-6 text-center shadow-sm sm:p-8">
        <div className="text-4xl">{completed ? "🎉" : "🏆"}</div>

        <h2 className="mt-3 text-2xl font-black">
          {completed
            ? "تم إكمال الدرس بنجاح"
            : "أحسنت! وصلت إلى نهاية الدرس"}
        </h2>

        <p className="mt-2 text-muted-foreground">
          {completed
            ? completionMessage
            : "أكمل التقويم ثم سجّل إنجازك واحصل على نقاط الدرس."}
        </p>

        {completionError ? (
          <div
            role="alert"
            className="mx-auto mt-4 max-w-xl rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive"
          >
            {completionError}
          </div>
        ) : null}

        <Button
          type="button"
          className="mt-5"
          disabled={isCompleting || completed}
          onClick={completeLesson}
        >
          {completed
            ? "✅ تم إكمال الدرس"
            : isCompleting
            ? "جارٍ تسجيل الإنجاز..."
            : `🏆 إكمال الدرس والحصول على ${lesson.points} نقطة`}
        </Button>
      </section>

      {showSuccessModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lesson-success-title"
        >
          <div className="w-full max-w-md rounded-3xl border bg-background p-6 text-center shadow-2xl sm:p-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
              🎉
            </div>

            <h2
              id="lesson-success-title"
              className="mt-5 text-2xl font-black"
            >
              تم إكمال الدرس بنجاح
            </h2>

            <p className="mt-3 leading-8 text-muted-foreground">
              {completionMessage}
            </p>

            <div className="mt-7 grid gap-3">
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/student");
                  router.refresh();
                }}
              >
                ✅ العودة إلى لوحة الطالب
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!nextLessonId}
                onClick={() => {
                  if (!nextLessonId) {
                    return;
                  }

                  setShowSuccessModal(false);
                  router.push(`/lessons/${nextLessonId}`);
                  router.refresh();
                }}
              >
                ➡️{" "}
                {nextLessonId
                  ? "الانتقال إلى الدرس التالي"
                  : "لا يوجد درس تالٍ متاح"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}