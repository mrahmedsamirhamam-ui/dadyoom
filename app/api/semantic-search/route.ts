import {
  NextResponse,
} from "next/server";

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
  createGroundedLessonAnswer,
} from "@/features/semantic-search/services/createGroundedLessonAnswer";

import {
  loadLessonChat,
} from "@/features/semantic-search/services/loadLessonChat";

import {
  saveLessonChat,
} from "@/features/semantic-search/services/saveLessonChat";

import {
  resolveFollowUpQuery,
} from "@/features/semantic-search/services/resolveFollowUpQuery";

type SearchRequestBody = {
  query?: string;
  lessonId?: string | null;
  history?: LessonChatHistoryItem[];
};

function mergeHistory(
  stored: LessonChatHistoryItem[],
  client: LessonChatHistoryItem[],
): LessonChatHistoryItem[] {
  const result: LessonChatHistoryItem[] = [];

  for (const message of [
    ...stored,
    ...client,
  ]) {
    const duplicate = result.some(
      (existing) =>
        existing.role === message.role &&
        existing.content === message.content,
    );

    if (!duplicate) {
      result.push(message);
    }
  }

  return result.slice(-20);
}

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
          (message.role === "user" ||
            message.role ===
              "assistant") &&
          typeof message.content ===
            "string" &&
          message.content.trim().length >
            0
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

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as
        SearchRequestBody;

    const query =
      body.query?.trim();

    if (!query) {
      return NextResponse.json(
        {
          error:
            "اكتب سؤالًا عن الدرس أولًا.",
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
    } =
      await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }

    const clientHistory =
      sanitizeHistory(body.history);

    const storedHistory =
      body.lessonId
        ? await loadLessonChat({
            supabase,
            studentId: user.id,
            lessonId: body.lessonId,
          })
        : [];

    const history =
      mergeHistory(
        storedHistory,
        clientHistory,
      );

    const resolvedQuery =
      await resolveFollowUpQuery({
        query,
        history,
      });

    const queryEmbedding =
      await createQueryEmbedding(
        resolvedQuery
      );

    const results =
      await searchLessonContext({
        supabase,
        queryEmbedding,
        lessonId:
          body.lessonId ?? null,
        threshold: 0.42,
        matchCount: 8,
        contextRadius: 3,
      });

    const answer =
      await createGroundedLessonAnswer({
        query: resolvedQuery,
        contexts: results,
        history,
      });

    if (
      body.lessonId &&
      answer.trim()
    ) {
      await saveLessonChat({
        supabase,
        studentId: user.id,
        lessonId: body.lessonId,
        userMessage: query,
        assistantMessage: answer.trim(),
      });
    }

    const suggestions =
      results.length > 0
        ? [
            "ما الفكرة الرئيسة؟",
            "ما القيمة التي نتعلمها؟",
            "اشرح الإجابة بطريقة أسهل.",
          ]
        : [];

    return NextResponse.json({
      query,
      resolvedQuery,
      answer,
      suggestions,
      bestContext:
        results[0]
          ?.context_text ??
        null,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "حدث خطأ غير متوقع.";

    console.error(
      "SEMANTIC_SEARCH_FAILED",
      error
    );

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}
