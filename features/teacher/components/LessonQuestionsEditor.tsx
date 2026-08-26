"use client";

import type {
  LessonQuestionForEditor,
  LessonQuestionOption,
} from "@/features/teacher/queries/getLessonQuestions";

import {
  createLessonQuestion,
  deleteLessonQuestion,
  moveLessonQuestion,
  updateLessonQuestion,
} from "@/features/teacher/actions/manageLessonQuestions";

type Props = {
  lessonId: string;
  questions:
    LessonQuestionForEditor[];
};

type QuestionCardProps = {
  lessonId: string;
  question:
    LessonQuestionForEditor;
  index: number;
  total: number;
};

function OptionFields({
  options,
}: {
  options:
    LessonQuestionOption[];
}) {
  return (
    <div className="space-y-3">
      <p className="font-semibold">
        {"\u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a"}
      </p>

      <input
        type="hidden"
        name="option_count"
        value={options.length}
      />

      {options.map(
        (
          option,
          index
        ) => (
          <div
            key={
              option.id +
              "-" +
              index
            }
            className="grid gap-2 md:grid-cols-[80px_1fr]"
          >
            <input
              type="hidden"
              name={
                "option_id_" +
                index
              }
              value={option.id}
            />

            <div className="flex items-center justify-center rounded-xl border bg-slate-50 px-3 font-bold">
              {option.id}
            </div>

            <input
              name={
                "option_text_" +
                index
              }
              defaultValue={
                option.text
              }
              required
              className="w-full rounded-xl border p-3"
            />
          </div>
        )
      )}
    </div>
  );
}

function QuestionCard({
  lessonId,
  question,
  index,
  total,
}: QuestionCardProps) {
  if (
    question.question_type !==
    "multiple_choice"
  ) {
    return (
      <div
        className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
      >
        <p className="font-bold">
          {"\u0627\u0644\u0633\u0624\u0627\u0644 "}
          {question.question_order}
        </p>

        <p className="mt-2">
          {question.question}
        </p>

        <p className="mt-3 text-sm text-amber-800">
          {
            "\u0647\u0630\u0627 \u0627\u0644\u0646\u0648\u0639 (" +
            question.question_type +
            ") \u063a\u064a\u0631 \u0642\u0627\u0628\u0644 \u0644\u0644\u062a\u0639\u062f\u064a\u0644 \u0641\u064a V1."
          }
        </p>
      </div>
    );
  }

  return (
    <div
      className="space-y-5 rounded-2xl border bg-white p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {"\u0627\u0644\u0633\u0624\u0627\u0644"}
          </p>

          <p className="text-xl font-bold">
            {question.question_order}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <form
            action={
              moveLessonQuestion
            }
          >
            <input
              type="hidden"
              name="lesson_id"
              value={lessonId}
            />

            <input
              type="hidden"
              name="question_id"
              value={question.id}
            />

            <input
              type="hidden"
              name="direction"
              value="-1"
            />

            <button
              type="submit"
              disabled={
                index === 0
              }
              className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              title={
                "\u062a\u062d\u0631\u064a\u0643 \u0644\u0623\u0639\u0644\u0649"
              }
            >
              {"\u2191"}
            </button>
          </form>

          <form
            action={
              moveLessonQuestion
            }
          >
            <input
              type="hidden"
              name="lesson_id"
              value={lessonId}
            />

            <input
              type="hidden"
              name="question_id"
              value={question.id}
            />

            <input
              type="hidden"
              name="direction"
              value="1"
            />

            <button
              type="submit"
              disabled={
                index ===
                total - 1
              }
              className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              title={
                "\u062a\u062d\u0631\u064a\u0643 \u0644\u0623\u0633\u0641\u0644"
              }
            >
              {"\u2193"}
            </button>
          </form>

          <form
            action={
              deleteLessonQuestion
            }
            onSubmit={
              (event) => {
                const approved =
                  window.confirm(
                    "\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0627\u0644\u0633\u0624\u0627\u0644\u061f \u0633\u064a\u0645\u0646\u0639 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u062d\u0630\u0641 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0645\u0631\u062a\u0628\u0637\u0627 \u0628\u0645\u062d\u0627\u0648\u0644\u0627\u062a \u0637\u0644\u0627\u0628 \u0623\u0648 \u0645\u0647\u0627\u0631\u0627\u062a."
                  );

                if (!approved) {
                  event.preventDefault();
                }
              }
            }
          >
            <input
              type="hidden"
              name="lesson_id"
              value={lessonId}
            />

            <input
              type="hidden"
              name="question_id"
              value={question.id}
            />

            <button
              type="submit"
              className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700"
            >
              {"\u062d\u0630\u0641"}
            </button>
          </form>
        </div>
      </div>

      <form
        action={
          updateLessonQuestion
        }
        className="space-y-5"
      >
        <input
          type="hidden"
          name="lesson_id"
          value={lessonId}
        />

        <input
          type="hidden"
          name="question_id"
          value={question.id}
        />

        <input
          type="hidden"
          name="question_type"
          value="multiple_choice"
        />

        <div>
          <label className="mb-2 block font-semibold">
            {"\u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644"}
          </label>

          <textarea
            name="question"
            defaultValue={
              question.question
            }
            required
            rows={3}
            className="w-full rounded-xl border p-3"
          />
        </div>

        <OptionFields
          options={
            question.options
          }
        />

        <div>
          <label className="mb-2 block font-semibold">
            {"\u0627\u0644\u0625\u062c\u0627\u0628\u0629 \u0627\u0644\u0635\u062d\u064a\u062d\u0629"}
          </label>

          <select
            name="correct_answer"
            defaultValue={
              question.correct_answer
            }
            required
            className="w-full rounded-xl border p-3"
          >
            {question.options.map(
              (option) => (
                <option
                  key={option.id}
                  value={option.id}
                >
                  {option.id +
                    " - " +
                    option.text}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="mb-2 block font-semibold">
            {"\u0627\u0644\u0634\u0631\u062d"}
          </label>

          <textarea
            name="explanation"
            defaultValue={
              question.explanation ??
              ""
            }
            rows={3}
            className="w-full rounded-xl border p-3"
          />
        </div>

        <div className="max-w-40">
          <label className="mb-2 block font-semibold">
            {"\u0627\u0644\u0646\u0642\u0627\u0637"}
          </label>

          <input
            name="points"
            type="number"
            min="1"
            step="1"
            defaultValue={
              question.points
            }
            required
            className="w-full rounded-xl border p-3"
          />
        </div>

        <button
          type="submit"
          data-testid={
            "lesson-question-save-" +
            question.id
          }
          className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition-colors hover:bg-emerald-700"
        >
          {"\u062d\u0641\u0638 \u0627\u0644\u0633\u0624\u0627\u0644"}
        </button>
      </form>
    </div>
  );
}

const newOptions:
  LessonQuestionOption[] = [
    {
      id: "a",
      text: "",
    },
    {
      id: "b",
      text: "",
    },
    {
      id: "c",
      text: "",
    },
    {
      id: "d",
      text: "",
    },
  ];

function NewQuestionForm({
  lessonId,
}: {
  lessonId: string;
}) {
  return (
    <details
      className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 p-5"
    >
      <summary className="cursor-pointer font-bold text-emerald-800">
        {"\u0625\u0636\u0627\u0641\u0629 \u0633\u0624\u0627\u0644 \u062c\u062f\u064a\u062f"}
      </summary>

      <form
        action={
          createLessonQuestion
        }
        className="mt-5 space-y-5"
      >
        <input
          type="hidden"
          name="lesson_id"
          value={lessonId}
        />

        <input
          type="hidden"
          name="question_type"
          value="multiple_choice"
        />

        <div>
          <label className="mb-2 block font-semibold">
            {"\u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644"}
          </label>

          <textarea
            name="question"
            required
            rows={3}
            className="w-full rounded-xl border bg-white p-3"
          />
        </div>

        <OptionFields
          options={newOptions}
        />

        <div>
          <label className="mb-2 block font-semibold">
            {"\u0627\u0644\u0625\u062c\u0627\u0628\u0629 \u0627\u0644\u0635\u062d\u064a\u062d\u0629"}
          </label>

          <select
            name="correct_answer"
            defaultValue="a"
            required
            className="w-full rounded-xl border bg-white p-3"
          >
            {newOptions.map(
              (option) => (
                <option
                  key={option.id}
                  value={option.id}
                >
                  {option.id}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="mb-2 block font-semibold">
            {"\u0627\u0644\u0634\u0631\u062d"}
          </label>

          <textarea
            name="explanation"
            rows={3}
            className="w-full rounded-xl border bg-white p-3"
          />
        </div>

        <div className="max-w-40">
          <label className="mb-2 block font-semibold">
            {"\u0627\u0644\u0646\u0642\u0627\u0637"}
          </label>

          <input
            name="points"
            type="number"
            min="1"
            step="1"
            defaultValue="1"
            required
            className="w-full rounded-xl border bg-white p-3"
          />
        </div>

        <button
          type="submit"
          data-testid="lesson-question-create"
          className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition-colors hover:bg-emerald-700"
        >
          {"\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0633\u0624\u0627\u0644"}
        </button>
      </form>
    </details>
  );
}

export default function LessonQuestionsEditor({
  lessonId,
  questions,
}: Props) {
  return (
    <div className="space-y-6 rounded-2xl border bg-white p-6">
      <div>
        <h2 className="text-2xl font-bold">
          {"\u0627\u0644\u0623\u0633\u0626\u0644\u0629"}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {
            "\u064a\u062d\u0627\u0641\u0638 \u0627\u0644\u0645\u062d\u0631\u0631 \u0639\u0644\u0649 \u0645\u0639\u0631\u0641 \u0643\u0644 \u0633\u0624\u0627\u0644 \u0648\u0645\u062d\u0627\u0648\u0644\u0627\u062a \u0627\u0644\u0637\u0644\u0627\u0628. V1 \u064a\u062f\u0639\u0645 \u0627\u0644\u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u0646 \u0645\u062a\u0639\u062f\u062f."
          }
        </p>
      </div>

      <NewQuestionForm
        key={
          "new-question-" +
          questions.length
        }
        lessonId={lessonId}
      />

      {questions.length === 0 ? (
        <div className="rounded-xl bg-slate-50 p-5 text-slate-500">
          {"\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u0633\u0626\u0644\u0629 \u0628\u0639\u062f."}
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map(
            (
              question,
              index
            ) => (
              <QuestionCard
                key={question.id}
                lessonId={lessonId}
                question={question}
                index={index}
                total={
                  questions.length
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
