"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import type {
  LessonChatHistoryItem,
  LessonChatMessage,
} from "../chat/LessonChatContext";

type StreamMetadataEvent = {
  type: "metadata";
  bestContext: string | null;
  resolvedQuery: string;
};

type StreamTextEvent = {
  type: "text";
  content: string;
};

type StreamLessonSuggestionsEvent = {
  type: "lessonSuggestions";
  followUpQuestions: string[];
  quizQuestion: string;
  nextActivity: string;
};

type StreamDoneEvent = {
  type: "done";
};

type StreamErrorEvent = {
  type: "error";
  message: string;
};

type StreamEvent =
  | StreamMetadataEvent
  | StreamTextEvent
  | StreamLessonSuggestionsEvent
  | StreamDoneEvent
  | StreamErrorEvent;

type LessonSemanticSearchProps = {
  lessonId: string;
};

function createMessage(
  role: "user" | "assistant",
  content: string
): LessonChatMessage {
  return {
    id:
      typeof crypto !== "undefined" &&
      "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export default function LessonSemanticSearch({
  lessonId,
}: LessonSemanticSearchProps) {
  const [query, setQuery] =
    useState("");

  const [messages, setMessages] =
    useState<LessonChatMessage[]>([]);

  const [followUpQuestions, setFollowUpQuestions] =
    useState<string[]>([]);

  const [quizQuestion, setQuizQuestion] =
    useState("");

  const [nextActivity, setNextActivity] =
    useState("");

  const [bestContext, setBestContext] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [isSending, setIsSending] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const response =
          await fetch(
            `/api/semantic-search/history?lessonId=${lessonId}`
          );

        if (!response.ok) {
          return;
        }

        const data =
          (await response.json()) as {
            history?: LessonChatMessage[];
          };

        if (
          cancelled ||
          !Array.isArray(data.history)
        ) {
          return;
        }

        setMessages(
          data.history.slice(-20)
        );
      } catch {
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  async function sendQuestion(
    question: string
  ): Promise<void> {
    const normalizedQuestion =
      question.trim();

    if (
      !normalizedQuestion ||
      isSending
    ) {
      return;
    }

    const history:
      LessonChatHistoryItem[] =
      messages
        .slice(-10)
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));

    const userMessage =
      createMessage(
        "user",
        normalizedQuestion
      );

    const assistantMessage =
      createMessage(
        "assistant",
        ""
      );

    setMessages((previous) =>
      [
        ...previous,
        userMessage,
        assistantMessage,
      ].slice(-20)
    );

    setQuery("");
    setError("");
    setBestContext(null);
    setFollowUpQuestions([]);
    setQuizQuestion("");
    setNextActivity("");
    setIsSending(true);

    try {
      const response = await fetch(
        "/api/semantic-search/stream",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            query:
              normalizedQuestion,
            lessonId,
            history,
          }),
        }
      );

      if (!response.ok) {
        const body =
          (await response.json()) as {
            error?: string;
          };

        throw new Error(
          body.error ||
            "تعذر بدء الإجابة."
        );
      }

      if (!response.body) {
        throw new Error(
          "لم يبدأ بث الإجابة."
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let buffer = "";
      let completedAnswer = "";

      while (true) {
        const {
          value,
          done,
        } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(
          value,
          {
            stream: true,
          }
        );

        const lines =
          buffer.split("\n");

        buffer =
          lines.pop() ?? "";

        for (const line of lines) {
          const normalizedLine =
            line.trim();

          if (!normalizedLine) {
            continue;
          }

          const event =
            JSON.parse(
              normalizedLine
            ) as StreamEvent;

          if (
            event.type ===
            "metadata"
          ) {
            setBestContext(
              event.bestContext
            );

            continue;
          }

          if (
            event.type === "text"
          ) {
            completedAnswer +=
              event.content;

            setMessages(
              (previous) =>
                previous.map(
                  (message) =>
                    message.id ===
                    assistantMessage.id
                      ? {
                          ...message,
                          content:
                            completedAnswer,
                        }
                      : message
                )
            );

            continue;
          }

          if (
            event.type ===
            "lessonSuggestions"
          ) {
            setFollowUpQuestions(
              event.followUpQuestions
            );

            setQuizQuestion(
              event.quizQuestion
            );

            setNextActivity(
              event.nextActivity
            );

            continue;
          }

          if (
            event.type === "done"
          ) {
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

            continue;
          }

          if (
            event.type === "error"
          ) {
            throw new Error(
              event.message
            );
          }
        }
      }

      if (!completedAnswer.trim()) {
        const fallback =
          "لا توجد في نص الدرس معلومات كافية للإجابة عن هذا السؤال.";

        setMessages((previous) =>
          previous.map((message) =>
            message.id ===
            assistantMessage.id
              ? {
                  ...message,
                  content: fallback,
                }
              : message
          )
        );
      }
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "حدث خطأ أثناء المحادثة.";

      setError(message);

      setMessages((previous) =>
        previous.filter(
          (item) =>
            item.id !==
            assistantMessage.id
        )
      );
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    await sendQuestion(query);
  }

  return (
    <section
      dir="rtl"
      className="rounded-3xl bg-white p-6 shadow-sm"
    >
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900">
          تحدث مع ضاد عن الدرس
        </h2>

        <p className="mt-2 leading-7 text-slate-600">
          اسأل سؤالًا، وسيجيب ضاد
          اعتمادًا على نص الدرس.
        </p>
      </div>

      <div className="mb-5 max-h-[500px] space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-slate-500">
            ابدأ بسؤال عن نص الدرس.
          </p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={
                message.role === "user"
                  ? "mr-auto max-w-[85%] rounded-2xl bg-emerald-600 px-4 py-3 text-white"
                  : "ml-auto max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
              }
            >
              <p className="mb-1 text-xs font-bold opacity-70">
                {message.role ===
                "user"
                  ? "الطالب"
                  : "ضاد"}
              </p>

              <p className="whitespace-pre-line leading-8">
                {message.content ||
                  (isSending
                    ? "يفكر ضاد..."
                    : "")}
              </p>
            </article>
          ))
        )}
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-3"
      >
        <textarea
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value
            )
          }
          rows={3}
          placeholder="اكتب سؤالك عن الدرس..."
          className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 leading-7 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />

        <button
          type="submit"
          disabled={
            isSending ||
            !query.trim()
          }
          className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending
            ? "ضاد يجيب..."
            : "أرسل إلى ضاد"}
        </button>
      </form>

      {followUpQuestions.length > 0 ? (
        <div className="mt-5">
          <p className="mb-3 text-sm font-bold text-slate-700">
            أسئلة متابعة:
          </p>

          <div className="flex flex-wrap gap-2">
            {followUpQuestions.map(
              (question) => (
                <button
                  key={question}
                  type="button"
                  disabled={isSending}
                  onClick={() =>
                    void sendQuestion(
                      question
                    )
                  }
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  {question}
                </button>
              )
            )}
          </div>
        </div>
      ) : null}

      {quizQuestion ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">
            سؤال سريع للتأكد من الفهم
          </p>

          <p className="mt-2 leading-7 text-slate-800">
            {quizQuestion}
          </p>

          <button
            type="button"
            disabled={isSending}
            onClick={() =>
              void sendQuestion(
                quizQuestion
              )
            }
            className="mt-3 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            أجب عن السؤال
          </button>
        </div>
      ) : null}

      {nextActivity ? (
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-bold text-blue-900">
            النشاط التالي المقترح
          </p>

          <p className="mt-2 leading-7 text-slate-800">
            {nextActivity}
          </p>
        </div>
      ) : null}

      {bestContext ? (
        <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer font-semibold text-slate-700">
            عرض المقطع المعتمد
          </summary>

          <p className="mt-3 leading-8 text-slate-700">
            {bestContext}
          </p>
        </details>
      ) : null}
    </section>
  );
}
