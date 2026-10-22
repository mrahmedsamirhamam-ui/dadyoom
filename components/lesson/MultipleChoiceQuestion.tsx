"use client";

import { useState } from "react";
import { syncLessonMasteryAction } from "@/features/lesson-mastery/actions/syncLessonMastery";

type Choice = { id: string; text: string };
type Props = {
  lessonId: string;
  questionId: string;
  userId: string | null;
  question: string;
  choices: Choice[];
};
type CheckedAnswer = {
  isCorrect: boolean;
  correctAnswer: string | null;
  explanation: string | null;
};

export default function MultipleChoiceQuestion({
  lessonId,
  questionId,
  userId,
  question,
  choices,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState<CheckedAnswer | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function checkAnswer() {
    if (!selected || saving || checked) return;
    setSaveError(null);

    if (!userId) {
      setSaveError("سجّل الدخول حتى تتحقق من الإجابة وتحفظ تقدمك.");
      return;
    }

    setSaving(true);
    try {
      // The browser sends the selected option only. Authentication, answer
      // validation and correctness are decided by the server.
      const response = await fetch("/api/questions/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          selectedAnswer: selected,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        isCorrect?: boolean;
        correctAnswer?: string | null;
        explanation?: string | null;
        error?: string;
      };

      if (
        !response.ok ||
        !result.success ||
        typeof result.isCorrect !== "boolean" ||
        (result.isCorrect && typeof result.correctAnswer !== "string")
      ) {
        throw new Error(result.error ?? "تعذر حفظ الإجابة.");
      }

      setChecked({
        isCorrect: result.isCorrect,
        correctAnswer: result.isCorrect ? result.correctAnswer ?? null : null,
        explanation: result.explanation ?? null,
      });

      try {
        await syncLessonMasteryAction(lessonId);
        window.dispatchEvent(
          new CustomEvent("lesson-mastery-updated", { detail: { lessonId } })
        );
      } catch (syncError) {
        console.error("LESSON_MASTERY_SYNC_FAILED", syncError);
        setSaveError("حُفظت إجابتك، لكن تعذّر تحديث مؤشر الإتقان الآن.");
      }
    } catch (error) {
      console.error("LESSON_QUESTION_SUBMIT_FAILED", error);
      setSaveError(
        error instanceof Error ? error.message : "تعذر حفظ الإجابة."
      );
    } finally {
      setSaving(false);
    }
  }

  function tryAgain() {
    setSelected(null);
    setChecked(null);
    setSaveError(null);
  }

  return (
    <section
      id={`question-${questionId}`}
      className="rounded-3xl bg-white p-6 shadow-sm"
    >
      <h2 className="mb-6 text-2xl font-bold text-slate-900">
        اختبر نفسك
      </h2>
      <p className="mb-6 text-lg text-slate-800">{question}</p>
      <div className="space-y-3">
        {choices.map((choice) => {
          const isSelected = selected === choice.id;
          const isCorrect = checked !== null &&
            choice.id === checked.correctAnswer;
          const isWrong = checked !== null && isSelected && !checked.isCorrect;
          return (
            <button
              key={choice.id}
              type="button"
              disabled={checked !== null || saving}
              onClick={() => setSelected(choice.id)}
              className={[
                "block w-full rounded-2xl border p-4 text-right transition",
                isSelected ? "border-emerald-600" : "border-slate-200",
                isCorrect ? "bg-emerald-100" : "",
                isWrong ? "bg-red-100" : "",
                checked !== null || saving
                  ? "cursor-default"
                  : "hover:border-emerald-400",
              ].join(" ")}
            >
              {choice.text}
            </button>
          );
        })}
      </div>

      {checked === null ? (
        <button
          type="button"
          disabled={!selected || saving || !userId}
          onClick={checkAnswer}
          className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "جارٍ تصحيح الإجابة وحفظها..." : "تحقق من الإجابة"}
        </button>
      ) : (
        <div className="mt-6 space-y-4">
          <div className={`rounded-xl p-4 font-semibold ${
            checked.isCorrect
              ? "bg-emerald-100 text-emerald-900"
              : "bg-red-100 text-red-900"
          }`}>
            {checked.isCorrect
              ? "✅ إجابة صحيحة"
              : "❌ راجع الشرح ثم حاول مجددًا؛ لم تُعرض الإجابة الصحيحة."}
          </div>

          {checked.explanation ? (
            <div className="rounded-xl bg-slate-100 p-4 leading-7 text-slate-700">
              {checked.explanation}
            </div>
          ) : null}

          {!checked.isCorrect ? (
            <button
              type="button"
              onClick={tryAgain}
              className="rounded-xl bg-slate-700 px-5 py-3 font-semibold text-white hover:bg-slate-800"
            >
              حاول مرة أخرى
            </button>
          ) : null}
        </div>
      )}

      {saveError ? (
        <p role="alert" className="mt-4 text-sm font-semibold text-red-700">
          {saveError}
        </p>
      ) : null}

      {!userId ? (
        <p className="mt-4 text-sm text-amber-700">
          سجّل الدخول حتى تُحفظ إجابتك ويُتحقق من صحتها.
        </p>
      ) : null}
    </section>
  );
}
