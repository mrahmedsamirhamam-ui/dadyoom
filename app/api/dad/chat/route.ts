import { createClient } from "@/lib/supabase/server";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DadChatRequest = {
  message?: string;
  mode?: "chat" | "check-understanding" | "lesson-completed";
  history?: ChatMessage[];
  pageTitle?: string;
  pageContext?: string;
  lessonTitle?: string;
  lessonContent?: string;
  studentLevel?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

function clean(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_MODEL?.trim();

    if (!apiKey || !model) {
      return Response.json(
        { error: "خدمة ضاد غير متاحة الآن." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as DadChatRequest;
    const mode = body.mode ?? "chat";
    const message = clean(body.message, 2400);
    const pageTitle = clean(body.pageTitle, 180);
    const pageContext = clean(body.pageContext, 2500);
    const lessonTitle = clean(body.lessonTitle, 220);
    const lessonContent = clean(body.lessonContent, 9000);
    const studentLevel = clean(body.studentLevel, 100);

    if (mode !== "lesson-completed" && !message) {
      return Response.json({ error: "اكتب رسالتك أولًا." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let learnerContext = "زائر غير مسجل";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,role,country")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        learnerContext = [
          profile.full_name ? `الاسم: ${profile.full_name}` : null,
          profile.role ? `الدور: ${profile.role}` : null,
          profile.country ? `الدولة: ${profile.country}` : null,
        ].filter(Boolean).join(" | ") || "مستخدم مسجل";
      } else {
        learnerContext = "مستخدم مسجل";
      }
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter((item) => item && typeof item.content === "string")
          .slice(-8)
          .map((item) => `${item.role === "assistant" ? "ضاد" : "المتعلم"}: ${clean(item.content, 1200)}`)
          .join("\n")
      : "";

    const currentMessage = mode === "lesson-completed"
      ? `أنهى المتعلم درس «${lessonTitle || "الدرس"}». هنئه باختصار واقترح خطوة تعليمية واحدة تالية.`
      : message;

    const prompt = `
أنت «ضاد»، الرفيق التعليمي الرسمي في «ضاديوم — بيت العربية الرقمي».

رسالتك:
- تجعل العربية أقرب إلى قلب المتعلم وعقله، وتساعده ولا تستبدل المعلم.
- تفهم اللهجات العربية وتحترمها، ثم تنتقل بسلاسة إلى فصحى سهلة عند التعليم.
- الفصحى جسر يجمع اللهجات، وليست أداة لإلغاء هوية المتعلم.

أسلوب الإجابة:
- ابدأ بالجواب المباشر في سطر أو سطرين.
- أضف مثالًا قصيرًا أو خطوة عملية فقط عند الحاجة.
- إذا كان المتعلم قد أخطأ، أعطه تلميحًا وفرصة جديدة بدل التوبيخ.
- اختم بسؤال تحقق واحد فقط عندما يفيد التعلم؛ لا تحوّل كل جواب إلى اختبار.
- لا تذكر مزود النموذج أو اسم Gemini؛ اسمك هنا «ضاد».
- لا تختلق درجة أو تقدمًا أو معلومة عن المنهج غير موجودة في السياق.
- إذا توفر محتوى درس فهو المصدر الأول. إذا لم يتضمن الإجابة، قل ذلك بوضوح ثم قدّم شرحًا عامًا آمنًا إن كان مناسبًا.
- أثناء الاختبار أو الواجب المقيم: اشرح الفكرة وقدّم تلميحًا بدل إعطاء الحل الجاهز مباشرة.
- اجعل الرد مناسبًا لطفل أو متعلم عربي، بلا حشو وبلا مصطلحات تقنية غير لازمة.

سياق المتعلم: ${learnerContext}
المستوى المرسل: ${studentLevel || "غير محدد"}
الصفحة: ${pageTitle || "ضاديوم"}
سياق الصفحة: ${pageContext || "غير متاح"}
الدرس: ${lessonTitle || "غير محدد"}
الوضع: ${mode}

محتوى الدرس:
${lessonContent || "لا يوجد نص درس مرفق."}

آخر المحادثة:
${history || "لا توجد محادثة سابقة."}

رسالة المتعلم:
${currentMessage}
`.trim();

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 650,
            topP: 0.9,
          },
        }),
        cache: "no-store",
      }
    );

    const data = (await geminiResponse.json()) as GeminiResponse;
    if (!geminiResponse.ok) {
      console.error("DAD_CHAT_PROVIDER_ERROR:", {
        status: geminiResponse.status,
        model,
        message: data.error?.message ?? null,
      });
      return Response.json(
        { error: "تعذر التواصل مع ضاد الآن. حاول مرة أخرى بعد قليل." },
        { status: 502 }
      );
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!reply) {
      return Response.json(
        { error: "لم يحصل ضاد على إجابة واضحة. جرّب صياغة السؤال بطريقة أخرى." },
        { status: 502 }
      );
    }

    return Response.json({ reply });
  } catch (error) {
    console.error("DAD_CHAT_ERROR:", error instanceof Error ? error.message : error);
    return Response.json(
      { error: "تعذر التواصل مع ضاد الآن. حاول مرة أخرى بعد قليل." },
      { status: 500 }
    );
  }
}
