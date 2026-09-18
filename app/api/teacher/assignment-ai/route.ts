import { NextResponse } from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";
import {
  runAgentJson,
} from "@/lib/ai/agents";

export const runtime = "nodejs";

type Draft = {
  instructions: string;
  questions: Array<{
    type: "multiple_choice" | "true_false" | "short_answer" | "essay";
    prompt: string;
    options: string[];
    correctAnswer: string | boolean | null;
    explanation: string;
    points: number;
  }>;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول." },
        { status: 401 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "teacher" && profile?.role !== "admin") {
      return NextResponse.json(
        { error: "هذه الأداة للمعلم." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      title?: string;
      kind?: string;
      lessonId?: string;
      questionCount?: number;
    };

    let context = "";

    if (body.lessonId) {
      const { data: lesson } = await supabase
        .from("lessons")
        .select("title,summary,content")
        .eq("id", body.lessonId)
        .maybeSingle();

      if (lesson) {
        context = [
          `عنوان الدرس: ${lesson.title}`,
          lesson.summary ? `الملخص: ${lesson.summary}` : "",
          lesson.content
            ? `المحتوى:\n${String(lesson.content).slice(0, 10000)}`
            : "",
        ]
          .filter(Boolean)
          .join("\n\n");
      }
    }

    const count = Math.max(
      3,
      Math.min(12, Math.round(Number(body.questionCount ?? 5))),
    );

    const result = await runAgentJson<Draft>({
      agent: "teacher-assistant",
      profile: "quality",
      context,
      maxTokens: 2600,
      prompt: `
أنشئ ${body.kind === "quiz" ? "اختبارًا" : "واجبًا أو تدريبًا"}
بعنوان: ${body.title || "مهمة لغة عربية"}.
عدد الأسئلة: ${count}.

أعد:
{
  "instructions": "تعليمات قصيرة",
  "questions": [
    {
      "type": "multiple_choice",
      "prompt": "السؤال",
      "options": ["أ","ب","ج","د"],
      "correctAnswer": "أ",
      "explanation": "تفسير مختصر",
      "points": 1
    }
  ]
}
الأنواع: multiple_choice, true_false, short_answer, essay.
في essay اجعل correctAnswer null.
`.trim(),
    });

    return NextResponse.json(result.data, {
      headers: {
        "X-Dadyoom-AI-Provider": result.provider,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر إنشاء المهمة.",
      },
      { status: 500 },
    );
  }
}
