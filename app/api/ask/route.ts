
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRole = "user" | "assistant";
type GeminiRole = "user" | "model";
type AskRequestBody = { question?: string; page?: string };
type ChatHistoryRow = { role: ChatRole; message: string };
type GeminiContent = { role: GeminiRole; parts: Array<{ text: string }> };
type GeminiResponse = {
  candidates?: Array<{
    content?: { role?: GeminiRole; parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; code?: number; status?: string };
};

function normalizeHistory(rows: ChatHistoryRow[]): GeminiContent[] {
  const normalized: GeminiContent[] = [];

  for (const row of rows) {
    if ((row.role !== "user" && row.role !== "assistant") || typeof row.message !== "string") continue;
    const text = row.message.trim().slice(0, 3000);
    if (!text) continue;

    const role: GeminiRole = row.role === "assistant" ? "model" : "user";
    const previous = normalized.at(-1);

    if (previous?.role === role) {
      previous.parts[0].text += `\n\n${text}`;
    } else {
      normalized.push({ role, parts: [{ text }] });
    }
  }

  return normalized;
}

async function getSession() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_MODEL?.trim();

    if (!apiKey || !model) {
      console.error("ASK_AI_CONFIGURATION_MISSING", { hasApiKey: Boolean(apiKey), hasModel: Boolean(model) });
      return NextResponse.json({ answer: "خدمة ضاد غير متاحة مؤقتًا. حاول مرة أخرى بعد قليل." }, { status: 503 });
    }

    let body: AskRequestBody;
    try {
      body = (await request.json()) as AskRequestBody;
    } catch {
      return NextResponse.json({ answer: "بيانات السؤال غير صالحة." }, { status: 400 });
    }

    const question = typeof body.question === "string" ? body.question.trim() : "";
    const currentPage = typeof body.page === "string" ? body.page.trim().slice(0, 250) : null;

    if (!question) {
      return NextResponse.json({ answer: "اكتب سؤالك أولًا، وأنا معك." }, { status: 400 });
    }

    const safeQuestion = question.slice(0, 3000);
    const { supabase, user } = await getSession();
    let historyRows: ChatHistoryRow[] = [];
    let profileContext = "";

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,role,country")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        profileContext = `الاسم: ${profile.full_name || "غير محدد"} | الدور: ${profile.role || "student"} | الدولة: ${profile.country || "غير محددة"}`;
      }

      const { error: insertError } = await supabase.from("chat_history").insert({
        user_id: user.id,
        role: "user",
        message: safeQuestion,
        page: currentPage,
      });

      if (insertError) {
        console.warn("CHAT_USER_MESSAGE_INSERT_WARNING:", insertError.message);
      } else {
        const { data, error: historyError } = await supabase
          .from("chat_history")
          .select("role,message")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (historyError) {
          console.warn("CHAT_HISTORY_SELECT_WARNING:", historyError.message);
        } else {
          historyRows = ((data ?? []) as ChatHistoryRow[]).reverse();
        }
      }
    }

    const contents = normalizeHistory(historyRows);
    if (contents.length === 0 || contents.at(-1)?.parts[0]?.text !== safeQuestion) {
      contents.push({ role: "user", parts: [{ text: safeQuestion }] });
    }

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      `${encodeURIComponent(model)}:generateContent`;

    const geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `
أنت "ضاد"، الرفيق التعليمي الرسمي في منصة "ضاديوم — بيت العربية الرقمي".

هويتك التعليمية:
- تساعد على تعلّم العربية بمحبة ووضوح، ولا تستبدل المعلم.
- افهم لهجات المتعلم العربية من دون السخرية منها أو تصحيحها لمجرد كونها لهجة.
- إذا كتب المتعلم بلهجته، يمكنك أن تبدأ بعبارة قصيرة مألوفة له ثم انتقل بسلاسة إلى العربية الفصحى السهلة في الشرح والتعليم.
- الفصحى جسر يجمع اللهجات ولا يلغيها.
- راعِ عمر المتعلم ومستواه وسياق سؤاله.
- اشرح النحو والصرف والإملاء والقراءة والكتابة والتعبير والمفردات في السياق.
- صحح الأخطاء باحترام، وقدّم أمثلة قصيرة وخطوات واضحة.
- شجّع التفكير والمحاولة، ولا تختلق معلومة عند عدم التأكد.
- لا تذكر اسم مزود النموذج أو تقول إنك Gemini؛ اسمك داخل المنصة هو "ضاد".

سياق المستخدم: ${profileContext || "زائر غير مسجل"}
الصفحة الحالية: ${currentPage || "غير محددة"}
            `.trim(),
          }],
        },
        contents,
        generationConfig: { temperature: 0.45, maxOutputTokens: 700, topP: 0.9 },
      }),
      cache: "no-store",
    });

    const data = (await geminiResponse.json()) as GeminiResponse;

    if (!geminiResponse.ok) {
      console.error("ASK_AI_PROVIDER_ERROR:", {
        status: geminiResponse.status,
        model,
        message: data.error?.message ?? null,
      });
      return NextResponse.json({ answer: "تعذر على ضاد إكمال الإجابة الآن. حاول مرة أخرى بعد قليل." }, { status: 502 });
    }

    if (data.promptFeedback?.blockReason) {
      return NextResponse.json({ answer: "لم أتمكن من معالجة هذا السؤال بصيغته الحالية. حاول صياغته بصورة تعليمية أو أوضح." }, { status: 400 });
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

    if (!answer) {
      console.error("ASK_AI_EMPTY_RESPONSE:", { model, finishReason: data.candidates?.[0]?.finishReason });
      return NextResponse.json({ answer: "وصلني سؤالك، لكن لم أحصل على إجابة واضحة. جرّب صياغته بطريقة أخرى." }, { status: 502 });
    }

    if (user) {
      const { error: saveError } = await supabase.from("chat_history").insert({
        user_id: user.id,
        role: "assistant",
        message: answer,
        page: currentPage,
      });
      if (saveError) console.warn("CHAT_ASSISTANT_MESSAGE_INSERT_WARNING:", saveError.message);
    }

    return NextResponse.json({ answer }, { status: 200 });
  } catch (error) {
    console.error("ASK_ROUTE_UNEXPECTED_ERROR:", error);
    return NextResponse.json({ answer: "تعذر التواصل مع ضاد الآن. حاول مرة أخرى بعد قليل." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "لا توجد محادثة محفوظة لهذا الزائر." }, { status: 401 });
    }

    const { error } = await supabase.from("chat_history").delete().eq("user_id", user.id);
    if (error) {
      console.error("CHAT_HISTORY_DELETE_ERROR:", error.message);
      return NextResponse.json({ error: "تعذر مسح ذاكرة المحادثة." }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("CHAT_HISTORY_DELETE_UNEXPECTED_ERROR:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء مسح المحادثة." }, { status: 500 });
  }
}
