import { NextResponse } from "next/server";

import { runAgent } from "@/lib/ai/agents";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AskRequestBody = {
  question?: string;
  page?: string;
};

type ChatHistoryRow = {
  role: "user" | "assistant";
  message: string;
};

async function getSession() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return {
    supabase,
    user: error ? null : user,
  };
}

export async function POST(request: Request) {
  try {
    let body: AskRequestBody;

    try {
      body = (await request.json()) as AskRequestBody;
    } catch {
      return NextResponse.json(
        { answer: "بيانات السؤال غير صالحة." },
        { status: 400 },
      );
    }

    const question =
      typeof body.question === "string"
        ? body.question.trim().slice(0, 3000)
        : "";

    const page =
      typeof body.page === "string"
        ? body.page.trim().slice(0, 250)
        : "";

    if (!question) {
      return NextResponse.json(
        { answer: "اكتب سؤالك أولًا، وأنا معك." },
        { status: 400 },
      );
    }

    const { supabase, user } = await getSession();

    let profileContext = "";
    let history: ChatHistoryRow[] = [];

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "full_name,role,country,grade_number,interests,learning_goal,preferred_learning_style",
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        profileContext = [
          `الاسم: ${profile.full_name || "غير محدد"}`,
          `الدور: ${profile.role || "student"}`,
          `الدولة: ${profile.country || "غير محددة"}`,
          `الصف: ${profile.grade_number || "غير محدد"}`,
          `الاهتمامات: ${
            Array.isArray(profile.interests)
              ? profile.interests.join("، ")
              : "غير محددة"
          }`,
          `الهدف: ${profile.learning_goal || "غير محدد"}`,
          `أسلوب التعلم: ${
            profile.preferred_learning_style || "غير محدد"
          }`,
        ].join(" | ");
      }

      const { error: insertError } = await supabase
        .from("chat_history")
        .insert({
          user_id: user.id,
          role: "user",
          message: question,
          page: page || null,
        });

      if (insertError) {
        console.warn(
          "CHAT_USER_MESSAGE_INSERT_WARNING:",
          insertError.message,
        );
      }

      const { data, error: historyError } = await supabase
        .from("chat_history")
        .select("role,message")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(16);

      if (historyError) {
        console.warn(
          "CHAT_HISTORY_SELECT_WARNING:",
          historyError.message,
        );
      } else {
        history = ((data ?? []) as ChatHistoryRow[]).reverse();
      }
    }

    const historyContext = history
      .slice(-12)
      .map((item) => {
        const speaker =
          item.role === "assistant" ? "ضاد" : "المتعلم";

        return `${speaker}: ${String(item.message).slice(0, 1800)}`;
      })
      .join("\n");

    const context = [
      profileContext ? `ملف المتعلم: ${profileContext}` : "",
      page ? `الصفحة الحالية: ${page}` : "",
      historyContext
        ? `آخر سياق للمحادثة:\n${historyContext}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const result = await runAgent({
      agent: "dad-tutor",
      profile: "economy",
      prompt: question,
      context,
      maxTokens: 900,
    });

    const answer = result.text.trim();

    if (!answer) {
      return NextResponse.json(
        {
          answer:
            "وصلني سؤالك، لكن لم أحصل على إجابة واضحة. جرّب صياغته بطريقة أخرى.",
          code: "AI_EMPTY_RESPONSE",
          retryable: true,
        },
        { status: 502 },
      );
    }

    if (user) {
      const { error: saveError } = await supabase
        .from("chat_history")
        .insert({
          user_id: user.id,
          role: "assistant",
          message: answer,
          page: page || null,
        });

      if (saveError) {
        console.warn(
          "CHAT_ASSISTANT_MESSAGE_INSERT_WARNING:",
          saveError.message,
        );
      }
    }

    console.info("ASK_AI_ROUTER_OK", {
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
    });

    return NextResponse.json(
      {
        answer,
        routed: true,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.error("ASK_AI_ROUTER_ERROR", message);

    const unavailable =
      message.includes("DAD_AI_TEMPORARILY_UNAVAILABLE");

    return NextResponse.json(
      {
        answer: unavailable
          ? "ضاد متصل بنظام الذكاء الاصطناعي، لكن مزودي الخدمة غير متاحين مؤقتًا. حاول مرة أخرى بعد لحظات."
          : "ضاد مشغول الآن قليلًا ولم أتمكن من إكمال الإجابة. حاول مرة أخرى بعد لحظات.",
        code: unavailable
          ? "AI_PROVIDER_TEMPORARILY_UNAVAILABLE"
          : "AI_ROUTE_UNEXPECTED_ERROR",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "لا توجد محادثة محفوظة لهذا الزائر." },
        { status: 401 },
      );
    }

    const { error } = await supabase
      .from("chat_history")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "CHAT_HISTORY_DELETE_ERROR:",
        error.message,
      );

      return NextResponse.json(
        { error: "تعذر مسح ذاكرة المحادثة." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "CHAT_HISTORY_DELETE_UNEXPECTED_ERROR:",
      error,
    );

    return NextResponse.json(
      { error: "حدث خطأ أثناء مسح المحادثة." },
      { status: 500 },
    );
  }
}
