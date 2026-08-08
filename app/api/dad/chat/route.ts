import { createClient } from "@/lib/supabase/server";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DadChatRequest = {
  message?: string;
  history?: ChatMessage[];
  pageTitle?: string;
  pageContext?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        {
          error: "يجب تسجيل الدخول لاستخدام ضاد.",
        },
        {
          status: 401,
        }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

    if (!apiKey) {
      return Response.json(
        { error: "مفتاح GEMINI_API_KEY غير موجود في .env.local." },
        { status: 500 }
      );
    }

    const body = await request.json() as DadChatRequest;
    const message = body.message?.trim();

    if (!message) {
      return Response.json({ error: "الرسالة فارغة." }, { status: 400 });
    }

    const history = (body.history ?? [])
      .slice(-10)
      .map((item) => `${item.role}: ${item.content}`)
      .join("\n");

    const prompt = `
أنت ضاد، رفيق ذكي ودود لتعليم اللغة العربية.
استخدم العربية الفصحى الواضحة.
قدّم إجابة موجزة ومشجعة ومناسبة للطالب.
صحح الأخطاء بلطف ولا تخترع معلومات.

عنوان الصفحة: ${body.pageTitle ?? "غير محدد"}
سياق الصفحة: ${body.pageContext ?? "غير محدد"}

سجل المحادثة:
${history || "لا يوجد"}

الطالب: ${message}
ضاد:
`.trim();

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await geminiResponse.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
      error?: { message?: string };
    };

    if (!geminiResponse.ok) {
      throw new Error(data.error?.message ?? "فشل الاتصال بـ Gemini.");
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!reply) {
      throw new Error("لم تُرجع Gemini ردًا نصيًا.");
    }

    return Response.json({ reply });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error
          ? error.message
          : "حدث خطأ أثناء الاتصال بـ Gemini.",
      },
      { status: 500 }
    );
  }
}
