import { NextResponse } from "next/server";

import { runAgentJson } from "@/lib/ai/agents";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LessonPack = {
  title: string;
  durationMinutes: number;
  objectives: Array<{
    domain: "معرفي" | "مهاري" | "وجداني";
    bloom: string;
    text: string;
  }>;
  icebreaker: {
    title: string;
    minutes: number;
    instructions: string;
  };
  timeline: Array<{
    minutes: number;
    phase: string;
    teacherAction: string;
    studentAction: string;
    assessment: string;
  }>;
  differentiation: {
    support: string[];
    core: string[];
    extension: string[];
  };
  criticalThinking: string[];
  worksheet: Array<{
    type: "true_false" | "multiple_choice" | "short_answer" | "analysis";
    prompt: string;
    options: string[];
    answer: string;
  }>;
  quiz: Array<{
    question: string;
    answer: string;
  }>;
  homework: string;
  slides: Array<{
    title: string;
    bullets: string[];
    interaction: string;
  }>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/iu;

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

    const role = String(profile?.role ?? "").trim().toLowerCase();

    if (role !== "teacher" && role !== "admin") {
      return NextResponse.json(
        { error: "هذه الأداة مخصصة للمعلم." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      lessonId?: string;
      durationMinutes?: number;
      classProfile?: "support" | "mixed" | "advanced";
    };

    const lessonId = String(body.lessonId ?? "").trim();

    if (!UUID_RE.test(lessonId)) {
      return NextResponse.json(
        { error: "اختر درسًا صالحًا أولًا." },
        { status: 400 },
      );
    }

    const durationMinutes = Math.max(
      40,
      Math.min(90, Math.round(Number(body.durationMinutes ?? 55))),
    );

    const classProfile =
      body.classProfile === "support" ||
      body.classProfile === "advanced"
        ? body.classProfile
        : "mixed";

    const { data: lesson, error } = await supabase
      .from("lessons")
      .select("id,title,summary,content,lesson_type,estimated_minutes")
      .eq("id", lessonId)
      .eq("status", "published")
      .maybeSingle();

    if (error || !lesson) {
      return NextResponse.json(
        { error: "الدرس غير موجود أو غير منشور." },
        { status: 404 },
      );
    }

    const context = [
      `عنوان الدرس: ${lesson.title}`,
      lesson.lesson_type ? `نوع الدرس: ${lesson.lesson_type}` : "",
      lesson.summary ? `الملخص: ${lesson.summary}` : "",
      lesson.content
        ? `محتوى الدرس:\n${String(lesson.content).slice(0, 16000)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const profileLabel =
      classProfile === "support"
        ? "صف يحتاج دعمًا وتبسيطًا أكبر"
        : classProfile === "advanced"
          ? "صف متقدم يحتاج تحديًا أعلى"
          : "صف مختلط المستويات";

    const result = await runAgentJson<LessonPack>({
      agent: "teacher-assistant",
      profile: "quality",
      context,
      maxTokens: 5200,
      prompt: `
أنت مصمم تعليمي خبير باللغة العربية. أنشئ حزمة درس عملية كاملة اعتمادًا حصريًا على محتوى الدرس المرفق.

مدة الحصة: ${durationMinutes} دقيقة.
ملف الصف: ${profileLabel}.

أعد JSON مطابقًا تمامًا لهذا الشكل:
{
  "title": "عنوان الحزمة",
  "durationMinutes": ${durationMinutes},
  "objectives": [
    {"domain":"معرفي","bloom":"يحدد","text":"هدف قابل للقياس"},
    {"domain":"مهاري","bloom":"يطبق","text":"هدف قابل للقياس"},
    {"domain":"وجداني","bloom":"يقدّر","text":"هدف قابل للقياس"}
  ],
  "icebreaker": {
    "title": "اسم نشاط كسر الجمود",
    "minutes": 5,
    "instructions": "تعليمات قصيرة قابلة للتنفيذ"
  },
  "timeline": [
    {
      "minutes": 5,
      "phase": "التهيئة",
      "teacherAction": "دور المعلم",
      "studentAction": "دور الطالب",
      "assessment": "تقويم سريع"
    }
  ],
  "differentiation": {
    "support": ["نشاط للطلاب الذين يحتاجون دعمًا"],
    "core": ["نشاط للمستوى المتوقع"],
    "extension": ["نشاط إثرائي للمتقدمين"]
  },
  "criticalThinking": ["سؤال تفكير ناقد مرتبط بالنص"],
  "worksheet": [
    {
      "type": "multiple_choice",
      "prompt": "سؤال",
      "options": ["أ","ب","ج","د"],
      "answer": "الإجابة الصحيحة"
    }
  ],
  "quiz": [
    {"question":"سؤال تقويم ختامي","answer":"الإجابة"}
  ],
  "homework": "واجب منزلي قصير وهادف",
  "slides": [
    {
      "title": "عنوان الشريحة",
      "bullets": ["نقطة 1","نقطة 2"],
      "interaction": "سؤال أو نشاط تفاعلي"
    }
  ]
}

الشروط:
- صغ الأهداف بأفعال بلوم قابلة للقياس.
- اجعل مجموع دقائق timeline قريبًا جدًا من ${durationMinutes}.
- اجعل worksheet من 8 أسئلة متنوعة على الأقل.
- اجعل quiz من 5 أسئلة قصيرة على الأقل.
- اجعل slides بين 10 و12 شريحة.
- راع الفروق الفردية والتعلم النشط والتفكير الناقد.
- لا تضف معلومات موضوعية غير موجودة في الدرس.
- اللغة عربية سليمة ومناسبة للمعلم.
      `.trim(),
    });

    return NextResponse.json(result.data, {
      headers: {
        "Cache-Control": "no-store",
        "X-Dadyoom-AI-Provider": result.provider,
      },
    });
  } catch (error) {
    console.error(
      "TEACHER_LESSON_PACK_ERROR",
      error instanceof Error ? error.message : String(error),
    );

    return NextResponse.json(
      {
        error:
          "تعذر إنشاء الحزمة الآن. حاول مرة أخرى بعد قليل.",
      },
      { status: 500 },
    );
  }
}
