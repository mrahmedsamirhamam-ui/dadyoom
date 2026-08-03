import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

type CompanionRequest = {
  message?: string;
  mode?: "chat" | "check-understanding" | "lesson-completed";
  lessonTitle?: string;
  lessonContent?: string;
  pageTitle?: string;
  conversation?: {
    role: "user" | "assistant";
    content: string;
  }[];
};

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured.");

      return NextResponse.json(
        {
          error: "خدمة ضاد غير مهيأة حاليًا.",
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولًا." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CompanionRequest;

    const {
      message = "",
      mode = "chat",
      lessonTitle = "درس في اللغة العربية",
      lessonContent = "",
      pageTitle = "",
      conversation = [],
    } = body;

    const safeMessage = message.trim().slice(0, 2000);
    const safeLessonTitle = lessonTitle.trim().slice(0, 200);
    const safePageTitle = pageTitle.trim().slice(0, 200);
    const safeLessonContent = lessonContent.trim().slice(0, 8000);

    if (mode !== "lesson-completed" && !safeMessage) {
      return NextResponse.json(
        { error: "يرجى كتابة رسالة أولًا." },
        { status: 400 }
      );
    }

    const systemInstruction = `
أنت "ضاد"، الرفيق التعليمي الذكي داخل منصة ضاديوم لتعليم اللغة العربية.

شخصيتك:
- ودود، مشجع، ذكي، هادئ، وقريب من الطالب.
- تستخدم العربية الفصحى السهلة.
- لا تستخدم أسلوب التوبيخ أو السخرية.
- لا تعطِ إجابات طويلة إلا إذا طلب الطالب ذلك.
- لا تقل للطالب إنه فشل.
- عند الخطأ، أعطه تلميحًا ثم فرصة جديدة.
- أنت رفيق تعليمي، ولست الاختبار الرسمي للمنصة.

السياق الحالي:
- الصفحة: ${safePageTitle || "صفحة داخل ضاديوم"}
- الدرس: ${safeLessonTitle || "درس في اللغة العربية"}
- وضع التفاعل: ${mode}

محتوى الدرس المتاح:
${safeLessonContent || "لم يُرسل محتوى كامل للدرس."}

القواعد التعليمية:
1. اربط إجاباتك بمحتوى الدرس المتاح.
2. إذا لم يكن محتوى الدرس كافيًا، أخبر الطالب بذلك بوضوح.
3. عند وضع lesson-completed:
   - هنئ الطالب بجملة قصيرة.
   - اسأله هل فهم الدرس.
   - اعرض عليه: سؤال سريع، شرح مختصر، أو المتابعة.
4. عند وضع check-understanding:
   - قدم سؤالًا واحدًا فقط في كل مرة.
   - لا تعرض الإجابة مباشرة.
   - انتظر إجابة الطالب.
   - بعد إجابته، أخبره بلطف هل فهم الفكرة.
5. هذه الأسئلة للتثبيت والمراجعة وليست اختبارًا رسميًا.
6. لا تخرج عن تعليم اللغة العربية إلا إذا كان السؤال متعلقًا باستخدام المنصة.
`.trim();

    const previousConversation = conversation
      .slice(-8)
      .map((item) => {
        const speaker =
          item.role === "assistant" ? "ضاد" : "الطالب";

        return `${speaker}: ${item.content.trim().slice(0, 1500)}`;
      })
      .join("\n");

    const userPrompt =
      mode === "lesson-completed"
        ? `لقد أنهى الطالب درس "${safeLessonTitle}". تفاعل معه الآن وفق القواعد التعليمية.`
        : safeMessage;

    const prompt = `
${systemInstruction}

المحادثة السابقة:
${previousConversation || "لا توجد محادثة سابقة."}

رسالة الطالب الحالية:
${userPrompt}
`.trim();

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
    });

    const reply =
      response.text?.trim() ||
      "أحسنت! هل ترغب في سؤال سريع للتأكد من فهم الدرس؟";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Dad companion error:", error);

    return NextResponse.json(
      {
        error: "تعذر التواصل مع ضاد الآن. حاول مرة أخرى بعد قليل.",
      },
      { status: 500 }
    );
  }
}