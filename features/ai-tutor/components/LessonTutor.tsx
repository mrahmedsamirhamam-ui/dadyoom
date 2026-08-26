"use client";

import {
  FormEvent,
  useState,
  useTransition,
} from "react";

import { askLessonTutor } from "../actions/askLessonTutor";
import { clearLessonTutor } from "../actions/clearLessonTutor";

type Message = {
  id: string;
  role: "student" | "tutor";
  text: string;
};

type Props = {
  lessonId: string;
  initialMessages: Message[];
};

const suggestedQuestions = [
  "لخّص لي الدرس.",
  "ما الفكرة الرئيسة؟",
  "اشرح لي أصعب كلمة.",
  "اختبرني في الدرس.",
];

export default function LessonTutor({
  lessonId,
  initialMessages,
}: Props) {
  const [question, setQuestion] =
    useState("");

  const [messages, setMessages] =
    useState<Message[]>(initialMessages);

  const [error, setError] =
    useState<string | null>(null);

  const [isPending, startTransition] =
    useTransition();

  function submitQuestion(
    event?: FormEvent<HTMLFormElement>,
    suggestedQuestion?: string
  ) {
    event?.preventDefault();

    const text = (
      suggestedQuestion ?? question
    ).trim();

    if (!text || isPending) {
      return;
    }

    setError(null);

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "student",
        text,
      },
    ]);

    setQuestion("");

    startTransition(async () => {
      const result =
        await askLessonTutor(
          lessonId,
          text
        );

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "tutor",
          text: result.answer,
        },
      ]);
    });
  }

  function clearMessages() {
    startTransition(async () => {
      await clearLessonTutor(
        lessonId
      );

      setMessages([]);
      setError(null);
    });
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            اسأل ضاد
          </h2>

          <p className="mt-2 text-slate-500">
            اسأل عن أي كلمة أو فكرة في هذا الدرس.
          </p>
        </div>

        {messages.length > 0 ? (
          <button
            type="button"
            disabled={isPending}
            onClick={clearMessages}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            مسح المحادثة
          </button>
        ) : null}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {suggestedQuestions.map(
          (item) => (
            <button
              key={item}
              type="button"
              disabled={isPending}
              onClick={() =>
                submitQuestion(
                  undefined,
                  item
                )
              }
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
            >
              {item}
            </button>
          )
        )}
      </div>

      {messages.length > 0 ? (
        <div className="mb-5 max-h-96 space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "student"
                  ? "mr-auto max-w-[85%] rounded-2xl bg-emerald-600 p-4 text-white"
                  : "ml-auto max-w-[90%] rounded-2xl border bg-white p-4 leading-8 text-slate-700"
              }
            >
              {message.text}
            </div>
          ))}

          {isPending ? (
            <div className="ml-auto max-w-[90%] rounded-2xl border bg-white p-4 text-slate-500">
              ضاد يفكر في الإجابة...
            </div>
          ) : null}
        </div>
      ) : null}

      <form
        onSubmit={submitQuestion}
        className="space-y-3"
      >
        <textarea
          value={question}
          onChange={(event) =>
            setQuestion(
              event.target.value
            )
          }
          maxLength={500}
          rows={3}
          placeholder="مثال: ما معنى كلمة الحَرَّة؟"
          className="w-full resize-none rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
        />

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-slate-400">
            {question.length}/500
          </span>

          <button
            type="submit"
            disabled={
              isPending ||
              !question.trim()
            }
            className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending
              ? "جارٍ الإجابة..."
              : "إرسال السؤال"}
          </button>
        </div>
      </form>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
