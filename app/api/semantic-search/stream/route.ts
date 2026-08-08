import { logger } from "@/lib/logger";
import {
  createClient,
} from "@/lib/supabase/server";

import type {
  LessonChatHistoryItem,
} from "@/features/semantic-search/chat/LessonChatContext";

import {
  createQueryEmbedding,
} from "@/features/semantic-search/services/createQueryEmbedding";

import {
  searchLessonContext,
} from "@/features/semantic-search/services/searchLessonContext";

import {
  streamGroundedLessonAnswer,
} from "@/features/semantic-search/services/streamGroundedLessonAnswer";

import {
  createLessonSuggestions,
} from "@/features/semantic-search/services/createLessonSuggestions";

import {
  loadLessonChat,
} from "@/features/semantic-search/services/loadLessonChat";

import {
  saveLessonChat,
} from "@/features/semantic-search/services/saveLessonChat";

import {
  updateLessonMastery,
} from "@/features/semantic-search/services/updateLessonMastery";

import {
  resolveFollowUpQuery,
} from "@/features/semantic-search/services/resolveFollowUpQuery";

type SearchRequestBody = {
  query?: string;
  lessonId?: string | null;
  history?: LessonChatHistoryItem[];
};

type StreamEvent =
  | {
      type: "metadata";
      bestContext: string | null;
      resolvedQuery: string;
    }
  | {
      type: "text";
      content: string;
    }
  | {
      type: "lessonSuggestions";
      followUpQuestions: string[];
      quizQuestion: string;
      nextActivity: string;
    }
  | {
      type: "done";
    }
  | {
      type: "error";
      message: string;
    };

const FAILED_ANSWER_PATTERNS = [
  "لا توجد في نص الدرس معلومات كافية",
  "لا توجد معلومات كافية",
  "تعذر الحصول على الإجابة",
  "حدث خطأ",
];

function sanitizeHistory(
  value: unknown
): LessonChatHistoryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (
        item
      ): item is LessonChatHistoryItem => {
        if (
          typeof item !== "object" ||
          item === null
        ) {
          return false;
        }

        const message =
          item as Partial<LessonChatHistoryItem>;

        return (
          (
            message.role === "user" ||
            message.role === "assistant"
          ) &&
          typeof message.content ===
            "string" &&
          message.content.trim().length > 0
        );
      }
    )
    .map((message) => ({
      role: message.role,
      content:
        message.content
          .trim()
          .slice(0, 2000),
    }))
    .slice(-10);
}

function mergeHistory(
  storedHistory: LessonChatHistoryItem[],
  clientHistory: LessonChatHistoryItem[]
): LessonChatHistoryItem[] {
  const result:
    LessonChatHistoryItem[] = [];

  for (const message of [
    ...storedHistory,
    ...clientHistory,
  ]) {
    const duplicate = result.some(
      (existing) =>
        existing.role === message.role &&
        existing.content ===
          message.content
    );

    if (!duplicate) {
      result.push(message);
    }
  }

  return result.slice(-20);
}

function removeFailedAnswers(
  history: LessonChatHistoryItem[]
): LessonChatHistoryItem[] {
  return history
    .filter((message) => {
      if (message.role !== "assistant") {
        return true;
      }

      return !FAILED_ANSWER_PATTERNS.some(
        (pattern) =>
          message.content.includes(
            pattern
          )
      );
    })
    .slice(-10);
}

function encodeEvent(
  event: StreamEvent
): Uint8Array {
  return new TextEncoder().encode(
    `${JSON.stringify(event)}\n`
  );
}

export async function POST(
  request: Request
): Promise<Response> {
  try {
    const body =
      (await request.json()) as
        SearchRequestBody;

    const query =
      body.query?.trim();

    const lessonId =
      body.lessonId?.trim();

    if (!query) {
      return Response.json(
        {
          error:
            "اكتب سؤالًا عن الدرس أولًا.",
        },
        {
          status: 400,
        }
      );
    }

    if (!lessonId) {
      return Response.json(
        {
          error:
            "تعذر تحديد الدرس الحالي.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createClient();

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        {
          error:
            "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }

    const storedHistory =
      await loadLessonChat({
        supabase,
        studentId: user.id,
        lessonId,
      });

    const clientHistory =
      sanitizeHistory(
        body.history
      );

    const history =
      mergeHistory(
        storedHistory,
        clientHistory
      );

    const answerHistory =
      removeFailedAnswers(history);

    const resolvedQuery =
      await resolveFollowUpQuery({
        query,
        history: answerHistory,
      });

    logger.info(
      "SEMANTIC_QUERY_RESOLVED",
      {
        originalQuery: query,
        resolvedQuery,
        storedHistoryCount:
          storedHistory.length,
        clientHistoryCount:
          clientHistory.length,
      }
    );

    const queryEmbedding =
      await createQueryEmbedding(
        resolvedQuery
      );

    const results =
      await searchLessonContext({
        supabase,
        queryEmbedding,
        lessonId,
        threshold: 0.35,
        matchCount: 10,
        contextRadius: 4,
      });

    const bestContext =
      results[0]?.context_text ??
      null;

    const stream =
      new ReadableStream<Uint8Array>({
        async start(controller) {
          let assistantAnswer = "";

          try {
            controller.enqueue(
              encodeEvent({
                type: "metadata",
                bestContext,
                resolvedQuery,
              })
            );

            for await (
              const text of
              streamGroundedLessonAnswer({
                query: resolvedQuery,
                contexts: results,
                history: answerHistory,
              })
            ) {
              assistantAnswer += text;

              controller.enqueue(
                encodeEvent({
                  type: "text",
                  content: text,
                })
              );
            }

            const normalizedAnswer =
              assistantAnswer.trim();

            if (normalizedAnswer) {
              await saveLessonChat({
                supabase,
                studentId: user.id,
                lessonId,
                userMessage: query,
                assistantMessage:
                  normalizedAnswer,
              });

              await updateLessonMastery({
                supabase,
                studentId: user.id,
                lessonId,
                userQuestion: query,
                assistantAnswer:
                  normalizedAnswer,
                answeredCorrectly:
                  !normalizedAnswer.includes(
                    "لا توجد في نص الدرس معلومات كافية"
                  ) &&
                  !normalizedAnswer.includes(
                    "تعذر الحصول على الإجابة"
                  ),
              });
            }

            const lessonSuggestions =
              await createLessonSuggestions({
                query: resolvedQuery,
                answer:
                  normalizedAnswer,
                context:
                  bestContext ?? "",
              });

            controller.enqueue(
              encodeEvent({
                type:
                  "lessonSuggestions",
                followUpQuestions:
                  lessonSuggestions
                    .followUpQuestions,
                quizQuestion:
                  lessonSuggestions
                    .quizQuestion,
                nextActivity:
                  lessonSuggestions
                    .nextActivity,
              })
            );

            controller.enqueue(
              encodeEvent({
                type: "done",
              })
            );

            controller.close();
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "حدث خطأ أثناء توليد الإجابة.";

            console.error(
              "SEMANTIC_STREAM_GENERATION_FAILED",
              error
            );

            controller.enqueue(
              encodeEvent({
                type: "error",
                message,
              })
            );

            controller.close();
          }
        },
      });

    return new Response(stream, {
      headers: {
        "Content-Type":
          "application/x-ndjson; charset=utf-8",
        "Cache-Control":
          "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "حدث خطأ غير متوقع.";

    console.error(
      "SEMANTIC_STREAM_FAILED",
      error
    );

    return Response.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}
