import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

type CompanionRequest = {
  message?: string;
  mode?: "chat" | "check-understanding" | "lesson-completed";
  lessonTitle?: string;
  lessonContent?: string;
  pageTitle?: string;
  conversation?: { role: "user" | "assistant"; content: string }[];
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_MODEL?.trim();
    if (!apiKey || !model) return NextResponse.json({ error: "خدمة ضاد غير متاحة الآن." }, { status: 503 });

    const body = (await request.json()) as CompanionRequest;
    const mode = body.mode ?? "chat";
    const safeMessage = (body.message ?? "").trim().slice(0, 2000);
    const lessonTitle = (body.lessonTitle ?? "").trim().slice(0, 200);
    const pageTitle = (body.pageTitle ?? "").trim().slice(0, 200);
    const lessonContent = (body.lessonContent ?? "").trim().slice(0, 9000);
    const conversation = Array.isArray(body.conversation) ? body.conversation.slice(-8) : [];

    if (mode !== "lesson-completed" && !safeMessage) return NextResponse.json({ error: "اكتب رسالتك أولًا." }, { status: 400 });

    const ai = new GoogleGenAI({ apiKey });
    const history = conversation.map((item) => `${item.role === "assistant" ? "ضاد" : "المتعلم"}: ${item.content.trim().slice(0, 1200)}`).join("\n");
    const currentMessage = mode === "lesson-completed" ? `أنهى المتعلم درس «${lessonTitle || "الدرس"}». هنئه واقترح خطوة واحدة تالية.` : safeMessage;

    const prompt = `
أنت «ضاد»، الرفيق التعليمي الرسمي في «ضاديوم — بيت العربية الرقمي».

المبادئ:
- العربية الفصحى السهلة هي لغة التعليم، مع فهم لهجات المتعلم واحترامها.
- ابدأ بالإجابة المباشرة، ثم مثال قصير عند الحاجة، ثم سؤال تحقق واحد فقط إذا كان مفيدًا.
- لا تُطل الرد بلا داعٍ، ولا تعاقب المتعلم على الخطأ؛ أعطه تلميحًا وفرصة جديدة.
- لا تختلق معلومة عن المنهج أو تقدّم المستخدم.
- إذا كان محتوى الدرس متاحًا فاجعله المصدر الأول، وإذا لم يكفِ فقل ذلك بوضوح.
- لا تذكر مزود النموذج؛ اسمك داخل المنصة هو «ضاد».
- لا تساعد على الغش في اختبار جارٍ؛ اشرح الفكرة بدل إعطاء الحل الجاهز عندما يكون السياق اختبارًا.

السياق:
الصفحة: ${pageTitle || "ضاديوم"}
الدرس: ${lessonTitle || "غير محدد"}
الوضع: ${mode}

محتوى الدرس:
${lessonContent || "لا يوجد نص درس مرفق في هذه الرسالة."}

المحادثة السابقة:
${history || "لا توجد محادثة سابقة."}

رسالة المتعلم:
${currentMessage}
`.trim();

    const response = await ai.models.generateContent({ model, contents: prompt });
    const reply = response.text?.trim();
    if (!reply) return NextResponse.json({ error: "لم يحصل ضاد على إجابة واضحة. حاول صياغة السؤال بطريقة أخرى." }, { status: 502 });
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("DAD_COMPANION_ERROR:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "تعذر التواصل مع ضاد الآن. حاول مرة أخرى بعد قليل." }, { status: 500 });
  }
}
