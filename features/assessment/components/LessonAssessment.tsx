"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type Assessment = {
  id: string;
  lessonId: string;
  title: string;
  passage: string;
  question: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  skill: string;
  difficulty: string;
  completed: boolean;
};

type AssessmentSession = {
  id: string;
  lessonId: string;
  lessonTitle?: string;
  currentQuestion: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  difficulty: string;
  finished: boolean;
  score?: number;
};

type GenerateResponse = {
  success?: boolean;
  assessment?: Assessment;
  error?: string;
};

type SkillAnalytics = {
  total: number;
  correct: number;
  percentage: number;
};

type AssessmentAnalytics = {
  overallPercentage: number;
  strengths: string[];
  weaknesses: string[];
  skills: Record<
    string,
    SkillAnalytics
  >;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
};

type SessionResponse = {
  success?: boolean;
  session?: AssessmentSession;
  analytics?: AssessmentAnalytics | null;
  error?: string;
};

type SubmitResponse = {
  success?: boolean;
  correct?: boolean;
  score?: number;
  correctAnswer?: number;
  explanation?: string;
  message?: string;
};

type LessonAssessmentProps = {
  lessonId: string;
};

function difficultyLabel(
  difficulty: string
): string {
  if (difficulty === "hard") {
    return "متقدم";
  }

  if (difficulty === "medium") {
    return "متوسط";
  }

  return "سهل";
}

export default function LessonAssessment({
  lessonId,
}: LessonAssessmentProps) {
  const [assessment, setAssessment] =
    useState<Assessment | null>(
      null
    );

  const [session, setSession] =
    useState<AssessmentSession | null>(
      null
    );

  const [analytics, setAnalytics] =
    useState<AssessmentAnalytics | null>(
      null
    );

  const [
    selectedAnswer,
    setSelectedAnswer,
  ] =
    useState<number | null>(null);

  const [result, setResult] =
    useState<SubmitResponse | null>(
      null
    );

  const [error, setError] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const [
    isMovingNext,
    setIsMovingNext,
  ] =
    useState(false);

  const generateAssessment =
    useCallback(
      async (
        difficulty = "easy"
      ): Promise<void> => {
        setIsLoading(true);
        setError("");
        setResult(null);
        setSelectedAnswer(null);

        try {
          const response =
            await fetch(
              `/api/ai/assessment?lessonId=${encodeURIComponent(
                lessonId
              )}&difficulty=${encodeURIComponent(
                difficulty
              )}&timestamp=${Date.now()}`,
              {
                cache: "no-store",
              }
            );

          const data =
            (await response.json()) as
              GenerateResponse;

          if (
            !response.ok ||
            !data.success ||
            !data.assessment
          ) {
            throw new Error(
              data.error ||
                "تعذر إنشاء سؤال الاختبار."
            );
          }

          setAssessment(
            data.assessment
          );
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "حدث خطأ أثناء إنشاء السؤال."
          );
        } finally {
          setIsLoading(false);
        }
      },
      [lessonId]
    );

  const startSession =
    useCallback(async () => {
      setIsLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            "/api/ai/assessment/session",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                lessonId,
              }),
            }
          );

        const data =
          (await response.json()) as
            SessionResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.session
        ) {
          throw new Error(
            data.error ||
              "تعذر بدء جلسة الاختبار."
          );
        }

        setSession(data.session);

        if (!data.session.finished) {
          await generateAssessment(
            data.session.difficulty
          );
        }
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "حدث خطأ أثناء بدء الاختبار."
        );

        setIsLoading(false);
      }
    }, [
      lessonId,
      generateAssessment,
    ]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void startSession();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [startSession]);

  async function submitAnswer() {
    if (
      !assessment ||
      !session ||
      selectedAnswer === null ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/ai/assessment/submit",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              assessmentId:
                assessment.id,
              sessionId:
                session.id,
              answer:
                selectedAnswer,
            }),
          }
        );

      const data =
        (await response.json()) as
          SubmitResponse;

      if (
        !response.ok ||
        !data.success ||
        typeof data.correct !==
          "boolean"
      ) {
        throw new Error(
          data.message ||
            "تعذر تصحيح الإجابة."
        );
      }

      setResult(data);

      window.dispatchEvent(
        new CustomEvent(
          "lesson-mastery-updated",
          {
            detail: {
              lessonId,
            },
          }
        )
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "حدث خطأ أثناء التصحيح."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function moveToNextQuestion() {
    if (
      !session ||
      typeof result?.correct !==
        "boolean" ||
      isMovingNext
    ) {
      return;
    }

    setIsMovingNext(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/ai/assessment/next",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              sessionId:
                session.id,
              correct:
                result.correct,
            }),
          }
        );

      const data =
        (await response.json()) as
          SessionResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.session
      ) {
        throw new Error(
          data.error ||
            "تعذر الانتقال إلى السؤال التالي."
        );
      }

      setSession(data.session);

      if (data.analytics) {
        setAnalytics(
          data.analytics
        );
      }

      if (data.session.finished) {
        setAssessment(null);
        setResult(null);
        setSelectedAnswer(null);

        window.dispatchEvent(
          new CustomEvent(
            "lesson-mastery-updated",
            {
              detail: {
                lessonId,
              },
            }
          )
        );

        return;
      }

      await generateAssessment(
        data.session.difficulty
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "حدث خطأ أثناء الانتقال للسؤال التالي."
      );
    } finally {
      setIsMovingNext(false);
    }
  }

  if (
    session?.finished
  ) {
    const answered =
      session.correctAnswers +
      session.wrongAnswers;

    const score =
      session.score ??
      Math.round(
        (
          session.correctAnswers /
          Math.max(answered, 1)
        ) * 100
      );

    return (
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-bold text-emerald-700">
          انتهى الاختبار
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          نتيجتك النهائية
        </h1>

        <div className="mt-7 rounded-3xl bg-emerald-50 p-7 text-center">
          <p className="text-5xl font-black text-emerald-700">
            {score}%
          </p>

          <p className="mt-3 font-bold text-slate-700">
            مستوى إتقانك في هذا الاختبار
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-emerald-50 p-5 text-center">
            <p className="text-3xl font-black text-emerald-700">
              {session.correctAnswers}
            </p>

            <p className="mt-2 font-semibold text-slate-600">
              إجابات صحيحة
            </p>
          </div>

          <div className="rounded-2xl bg-red-50 p-5 text-center">
            <p className="text-3xl font-black text-red-700">
              {session.wrongAnswers}
            </p>

            <p className="mt-2 font-semibold text-slate-600">
              إجابات تحتاج مراجعة
            </p>
          </div>
        </div>

        {analytics ? (
          <div className="mt-7 space-y-5">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                تحليل مهاراتك
              </h2>

              <p className="mt-2 text-slate-600">
                يوضح التقرير أداءك في كل مهارة ظهرت في الاختبار.
              </p>
            </div>

            <div className="space-y-4">
              {Object.entries(
                analytics.skills
              ).map(
                ([
                  skill,
                  skillResult,
                ]) => (
                  <div
                    key={skill}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-bold text-slate-800">
                        {skill}
                      </p>

                      <p className="font-black text-emerald-700">
                        {skillResult.percentage}%
                      </p>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                        style={{
                          width: `${skillResult.percentage}%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {skillResult.correct} صحيحة من{" "}
                      {skillResult.total}
                    </p>
                  </div>
                )
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="font-black text-emerald-900">
                  نقاط القوة
                </p>

                {analytics.strengths.length >
                0 ? (
                  <ul className="mt-3 space-y-2 text-slate-700">
                    {analytics.strengths.map(
                      (skill) => (
                        <li key={skill}>
                          ✓ {skill}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="mt-3 text-slate-600">
                    استمر في التدريب حتى تظهر نقاط قوتك بوضوح.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-black text-amber-900">
                  مهارات تحتاج إلى تحسين
                </p>

                {analytics.weaknesses.length >
                0 ? (
                  <ul className="mt-3 space-y-2 text-slate-700">
                    {analytics.weaknesses.map(
                      (skill) => (
                        <li key={skill}>
                          • {skill}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="mt-3 text-slate-600">
                    رائع، لا توجد مهارة ضعيفة في هذه الجلسة.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-bold text-amber-900">
            توصية ضاد
          </p>

          <p className="mt-2 leading-8 text-slate-800">
            {score >= 80
              ? "أحسنت! لقد أتقنت الدرس ويمكنك الانتقال إلى الدرس التالي."
              : score >= 60
                ? "مستواك جيد. راجع بعض أفكار الدرس ثم جرّب الاختبار مرة أخرى."
                : "أعد قراءة الدرس واسأل ضاد عن الأجزاء التي تحتاج إلى توضيح."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setAssessment(null);
            setSession(null);
            setAnalytics(null);
            setResult(null);
            setSelectedAnswer(null);
            void startSession();
          }}
          className="mt-6 rounded-xl bg-slate-900 px-7 py-3 font-bold text-white transition hover:bg-slate-800"
        >
          ابدأ اختبارًا جديدًا
        </button>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-lg font-bold text-slate-700">
          ينشئ ضاد سؤالًا من نص الدرس...
        </p>
      </section>
    );
  }

  if (
    error &&
    !assessment
  ) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-8">
        <p className="text-red-700">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            void startSession()
          }
          className="mt-5 rounded-xl bg-red-600 px-5 py-3 font-bold text-white"
        >
          إعادة المحاولة
        </button>
      </section>
    );
  }

  if (
    !assessment ||
    !session
  ) {
    return null;
  }

  const progress =
    Math.round(
      (
        session.currentQuestion /
        session.totalQuestions
      ) * 100
    );

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-emerald-700">
            السؤال{" "}
            {session.currentQuestion} من{" "}
            {session.totalQuestions}
          </p>

          <h1 className="mt-1 text-3xl font-black text-slate-900">
            {assessment.title}
          </h1>
        </div>

        <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
          {difficultyLabel(
            session.difficulty
          )}
        </span>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="mt-7 rounded-2xl bg-slate-50 p-5">
        <p className="text-xl font-bold leading-9 text-slate-900">
          {assessment.question}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {assessment.choices.map(
          (choice, index) => {
            const isSelected =
              selectedAnswer === index;

            const isCorrectChoice =
              Boolean(result) &&
              result?.correctAnswer ===
                index;

            const isWrongSelected =
              Boolean(result) &&
              isSelected &&
              result?.correct === false;

            return (
              <button
                key={`${index}-${choice}`}
                type="button"
                disabled={Boolean(result)}
                onClick={() =>
                  setSelectedAnswer(
                    index
                  )
                }
                className={[
                  "w-full rounded-2xl border px-5 py-4 text-right font-semibold transition",
                  isCorrectChoice
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "",
                  isWrongSelected
                    ? "border-red-500 bg-red-50 text-red-900"
                    : "",
                  !result &&
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "",
                  !result &&
                  !isSelected
                    ? "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50"
                    : "",
                ].join(" ")}
              >
                <span className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black shadow-sm">
                  {index + 1}
                </span>

                {choice}
              </button>
            );
          }
        )}
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {!result ? (
        <button
          type="button"
          disabled={
            selectedAnswer === null ||
            isSubmitting
          }
          onClick={() =>
            void submitAnswer()
          }
          className="mt-7 rounded-xl bg-emerald-600 px-7 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "يصحح ضاد الإجابة..."
            : "تأكيد الإجابة"}
        </button>
      ) : (
        <div
          className={[
            "mt-7 rounded-2xl border p-5",
            result.correct
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50",
          ].join(" ")}
        >
          <h2 className="text-xl font-black">
            {result.correct
              ? "إجابة صحيحة، أحسنت!"
              : "إجابة تحتاج إلى مراجعة"}
          </h2>

          <p className="mt-3 leading-8 text-slate-800">
            {result.explanation ||
              assessment.explanation}
          </p>

          <button
            type="button"
            disabled={isMovingNext}
            onClick={() =>
              void moveToNextQuestion()
            }
            className="mt-5 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {isMovingNext
              ? "يجري تجهيز السؤال..."
              : session.currentQuestion >=
                    session.totalQuestions
                ? "عرض النتيجة النهائية"
                : "السؤال التالي"}
          </button>
        </div>
      )}
    </section>
  );
}