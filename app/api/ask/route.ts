import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRole = "user" | "assistant";
type GeminiRole = "user" | "model";

type AskRequestBody = {
  question?: string;
  page?: string;
};

type ChatHistoryRow = {
  role: ChatRole;
  message: string;
};

type GeminiContent = {
  role: GeminiRole;
  parts: Array<{
    text: string;
  }>;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      role?: GeminiRole;
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
    code?: number;
    status?: string;
  };
};

function normalizeHistory(rows: ChatHistoryRow[]): GeminiContent[] {
  const normalized: GeminiContent[] = [];

  for (const row of rows) {
    if (
      (row.role !== "user" && row.role !== "assistant") ||
      typeof row.message !== "string"
    ) {
      continue;
    }

    const text = row.message.trim().slice(0, 3000);

    if (!text) {
      continue;
    }

    const role: GeminiRole =
      row.role === "assistant" ? "model" : "user";

    const previous = normalized.at(-1);

    // دمج الرسائل المتتالية من الدور نفسه لتجنب أخطاء ترتيب أدوار Gemini.
    if (previous?.role === role) {
      previous.parts[0].text += `\n\n${text}`;
      continue;
    }

    normalized.push({
      role,
      parts: [{ text }],
    });
  }

  return normalized;
}

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return {
    supabase,
    user,
    error,
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_MODEL?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          answer:
            "مفتاح Gemini غير موجود داخل إعدادات الخادم.",
        },
        { status: 500 }
      );
    }

    if (!model) {
      return NextResponse.json(
        {
          answer:
            "اسم نموذج Gemini غير موجود. أضف GEMINI_MODEL داخل ملف .env.local.",
        },
        { status: 500 }
      );
    }

    const { supabase, user, error: userError } =
      await getAuthenticatedUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          answer:
            "يجب تسجيل الدخول حتى يتمكن ضاد من حفظ محادثتك.",
        },
        { status: 401 }
      );
    }

    let body: AskRequestBody;

    try {
      body = (await request.json()) as AskRequestBody;
    } catch {
      return NextResponse.json(
        {
          answer: "بيانات الطلب غير صالحة.",
        },
        { status: 400 }
      );
    }

    const question =
      typeof body.question === "string"
        ? body.question.trim()
        : "";

    const currentPage =
      typeof body.page === "string"
        ? body.page.trim().slice(0, 250)
        : null;

    if (!question) {
      return NextResponse.json(
        {
          answer: "اكتب سؤالك أولًا، وأنا معك.",
        },
        { status: 400 }
      );
    }

    const safeQuestion = question.slice(0, 3000);

    const { error: userMessageError } = await supabase
      .from("chat_history")
      .insert({
        user_id: user.id,
        role: "user",
        message: safeQuestion,
        page: currentPage,
      });

    if (userMessageError) {
      console.error(
        "CHAT_USER_MESSAGE_INSERT_ERROR:",
        userMessageError
      );

      return NextResponse.json(
        {
          answer:
            "تعذر حفظ رسالتك في ذاكرة ضاد. تحقق من جدول chat_history وسياسات RLS.",
        },
        { status: 500 }
      );
    }

    const {
      data: historyData,
      error: historyError,
    } = await supabase
      .from("chat_history")
      .select("role, message")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (historyError) {
      console.error(
        "CHAT_HISTORY_SELECT_ERROR:",
        historyError
      );

      return NextResponse.json(
        {
          answer:
            "تعذر استرجاع ذاكرة المحادثة من قاعدة البيانات.",
        },
        { status: 500 }
      );
    }

    const chronologicalHistory = (
      (historyData ?? []) as ChatHistoryRow[]
    ).reverse();

    const geminiHistory =
      normalizeHistory(chronologicalHistory);

    if (geminiHistory.length === 0) {
      geminiHistory.push({
        role: "user",
        parts: [{ text: safeQuestion }],
      });
    }

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      `${encodeURIComponent(model)}:generateContent`;

    const geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: `
أنت "ضاد"، المساعد التعليمي الرسمي في منصة
"ضاديوم — بيت العربية الرقمي".

هويتك:
- اسمك ضاد.
- تتحدث بالعربية الفصحى السهلة.
- أسلوبك دافئ ومشجع.
- تساعد الطلاب في تعلم اللغة العربية.
- تراعي عمر الطالب ومستواه.
- تستفيد من سياق المحادثة السابقة المرسل إليك.

مهامك:
- شرح النحو والصرف والإملاء.
- تعليم القراءة والكتابة والتعبير.
- شرح المفردات ومعاني الكلمات في السياق.
- تصحيح الأخطاء باحترام ومن دون توبيخ.
- تقديم أمثلة قصيرة وواضحة.
- تقسيم الشرح إلى خطوات عندما يكون الدرس صعبًا.
- تشجيع الطالب على المحاولة والتفكير.
- عدم اختلاق معلومات عند عدم التأكد.
- طلب توضيح السؤال إذا كان غامضًا.
- عدم تقديم إجابات طويلة إلا عند الحاجة.
- عدم ذكر أنك Gemini أو أنك نموذج من Google.
- تعريف نفسك دائمًا باسم "ضاد".

الصفحة الحالية داخل المنصة:
${currentPage || "غير محددة"}
              `.trim(),
            },
          ],
        },
        contents: geminiHistory,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 700,
          topP: 0.9,
        },
      }),
      cache: "no-store",
    });

    const data =
      (await geminiResponse.json()) as GeminiResponse;

    if (!geminiResponse.ok) {
      const errorMessage =
        data.error?.message ||
        `فشل طلب Gemini، رمز الخطأ: ${geminiResponse.status}`;

      console.error("GEMINI_API_ERROR:", {
        status: geminiResponse.status,
        model,
        message: errorMessage,
      });

      return NextResponse.json(
        {
          answer: `حدث خطأ في Gemini: ${errorMessage}`,
        },
        {
          status:
            geminiResponse.status >= 400 &&
            geminiResponse.status <= 599
              ? geminiResponse.status
              : 500,
        }
      );
    }

    if (data.promptFeedback?.blockReason) {
      return NextResponse.json(
        {
          answer:
            "لم أتمكن من الإجابة عن هذا السؤال. حاول صياغته بطريقة تعليمية أو أوضح.",
        },
        { status: 400 }
      );
    }

    const answer =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim() ?? "";

    if (!answer) {
      console.error("GEMINI_EMPTY_RESPONSE:", {
        model,
        finishReason:
          data.candidates?.[0]?.finishReason,
      });

      return NextResponse.json(
        {
          answer:
            "وصلني سؤالك، لكن ضاد لم يحصل على إجابة واضحة. حاول صياغة السؤال بطريقة أخرى.",
        },
        { status: 502 }
      );
    }

    const { error: assistantMessageError } =
      await supabase
        .from("chat_history")
        .insert({
          user_id: user.id,
          role: "assistant",
          message: answer,
          page: currentPage,
        });

    if (assistantMessageError) {
      console.error(
        "CHAT_ASSISTANT_MESSAGE_INSERT_ERROR:",
        assistantMessageError
      );
    }

    return NextResponse.json(
      { answer },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ASK_ROUTE_UNEXPECTED_ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "حدث خطأ غير معروف.";

    return NextResponse.json(
      {
        answer:
          `حدث خطأ في الاتصال بذاكرة ضاد: ${message}`,
      },
      { status: 500 }
    );
  }
}

/*
 * يستخدمه زر "محادثة جديدة" لمسح ذاكرة المستخدم من Supabase.
 */
export async function DELETE() {
  try {
    const { supabase, user, error: userError } =
      await getAuthenticatedUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "يجب تسجيل الدخول لمسح المحادثة.",
        },
        { status: 401 }
      );
    }

    const { error: deleteError } = await supabase
      .from("chat_history")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error(
        "CHAT_HISTORY_DELETE_ERROR:",
        deleteError
      );

      return NextResponse.json(
        {
          error:
            "تعذر مسح ذاكرة المحادثة.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "CHAT_HISTORY_DELETE_UNEXPECTED_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "حدث خطأ أثناء مسح المحادثة.",
      },
      { status: 500 }
    );
  }
}