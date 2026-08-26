"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { syncLessonMasteryAction } from "@/features/lesson-mastery/actions/syncLessonMastery";

type Choice = {
  id: string;
  text: string;
};

type Props = {
  lessonId: string;
  questionId: string;
  userId: string | null;
  question: string;
  choices: Choice[];
  correctAnswer: string;
  explanation?: string | null;
};

export default function MultipleChoiceQuestion({
  lessonId,
  questionId,
  userId,
  question,
  choices,
  correctAnswer,
  explanation,
}: Props) {
  const supabase =
    createClient();

  const [
    selected,
    setSelected,
  ] =
    useState<string | null>(
      null
    );

  const [
    checked,
    setChecked,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    saveError,
    setSaveError,
  ] =
    useState<string | null>(
      null
    );

  async function checkAnswer() {
    if (!selected) {
      return;
    }

    setChecked(true);
    setSaveError(null);

    if (!userId) {
      return;
    }

    setSaving(true);

    const isCorrect =
      selected ===
      correctAnswer;

    const {
      error,
    } = await supabase
      .from("question_attempts")
      .upsert(
        {
          user_id:
            userId,

          question_id:
            questionId,

          selected_answer:
            selected,

          is_correct:
            isCorrect,

          answered_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "user_id,question_id",
        }
      );

    if (error) {
      console.error(error);

      setSaveError(
        "تعذر حفظ الإجابة."
      );

      setSaving(false);
      return;
    }

    try {
      await syncLessonMasteryAction(
        lessonId
      );

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
    } catch (error) {
      console.error(
        "LESSON_MASTERY_SYNC_FAILED",
        error
      );
    }

    setSaving(false);
  }

  function tryAgain() {
    setSelected(null);
    setChecked(false);
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

      <p className="mb-6 text-lg text-slate-800">
        {question}
      </p>

      <div className="space-y-3">
        {choices.map(
          (choice) => {
            const isSelected =
              selected ===
              choice.id;

            const isCorrect =
              checked &&
              choice.id ===
                correctAnswer;

            const isWrong =
              checked &&
              isSelected &&
              choice.id !==
                correctAnswer;

            return (
              <button
                key={choice.id}
                type="button"
                disabled={
                  checked ||
                  saving
                }
                onClick={() =>
                  setSelected(
                    choice.id
                  )
                }
                className={[
                  "block w-full rounded-2xl border p-4 text-right transition",
                  isSelected
                    ? "border-emerald-600"
                    : "border-slate-200",
                  isCorrect
                    ? "bg-emerald-100"
                    : "",
                  isWrong
                    ? "bg-red-100"
                    : "",
                  checked ||
                  saving
                    ? "cursor-default"
                    : "hover:border-emerald-400",
                ].join(" ")}
              >
                {choice.text}
              </button>
            );
          }
        )}
      </div>

      {!checked ? (
        <button
          type="button"
          disabled={
            !selected ||
            saving
          }
          onClick={
            checkAnswer
          }
          className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "جارٍ الحفظ..."
            : "تحقق من الإجابة"}
        </button>
      ) : (
        <div className="mt-6 space-y-4">
          <div
            className={`rounded-xl p-4 font-semibold ${
              selected ===
              correctAnswer
                ? "bg-emerald-100 text-emerald-900"
                : "bg-red-100 text-red-900"
            }`}
          >
            {selected ===
            correctAnswer
              ? "✅ إجابة صحيحة"
              : "❌ إجابة غير صحيحة"}
          </div>

          {explanation ? (
            <div className="rounded-xl bg-slate-100 p-4 leading-7 text-slate-700">
              {explanation}
            </div>
          ) : null}

          {saveError ? (
            <p className="text-sm font-semibold text-red-600">
              {saveError}
            </p>
          ) : null}

          {selected !==
          correctAnswer ? (
            <button
              type="button"
              onClick={
                tryAgain
              }
              className="rounded-xl bg-slate-700 px-5 py-3 font-semibold text-white hover:bg-slate-800"
            >
              حاول مرة أخرى
            </button>
          ) : null}
        </div>
      )}

      {!userId ? (
        <p className="mt-4 text-sm text-amber-700">
          سجّل الدخول حتى تُحفظ إجابتك.
        </p>
      ) : null}
    </section>
  );
}
