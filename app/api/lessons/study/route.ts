import {
  createClient as createAdminClient,
} from "@supabase/supabase-js";
import {
  after,
  NextResponse,
} from "next/server";

import {
  consumeFeature,
} from "@/lib/billing/access";
import {
  createClient,
} from "@/lib/supabase/server";
import {
  runAgent,
  runAgentJson,
} from "@/lib/ai/agents";

import { buildEvidenceDeck } from "@/lib/lesson/evidence-slide-deck";

export const runtime = "nodejs";

type Task =
  | "summary"
  | "slides"
  | "flashcards"
  | "study_guide"
  | "concept_map"
  | "video_storyboard"
  | "notebook_answer"
  | "custom_summary"
  | "custom_slides";

type RichSlide = {
  kind?:
    | "cover"
    | "objectives"
    | "concept"
    | "compare"
    | "activity"
    | "review";
  title: string;
  subtitle?: string;
  bullets?: string[];
  callout?: string;
  leftTitle?: string;
  leftItems?: string[];
  rightTitle?: string;
  rightItems?: string[];
  question?: string;
  answer?: string;
  narration?: string;
  seconds?: number;
};

type Deck = {
  title?: string;
  slides: RichSlide[];
};

type LessonRow = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  learning_objectives?: unknown;
  vocabulary?: unknown;
  instructions?: unknown;
};

const SLIDE_PROMPT_VERSION =
  "upgrade3-notebookdeck-v1";

function adminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) return null;

  return createAdminClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function fallbackDeck(lesson: LessonRow): Deck | null {
  return buildEvidenceDeck(lesson);
}

function slidePrompt(
  custom: boolean,
) {
  return `
أعد JSON صالحًا فقط لعرض تعليمي عربي حديث:
{
  "title": "عنوان العرض",
  "slides": [
    {
      "kind": "cover|objectives|concept|compare|activity|review",
      "title": "عنوان الشريحة",
      "subtitle": "اختياري",
      "bullets": ["نقطة قصيرة"],
      "callout": "اختياري",
      "leftTitle": "اختياري",
      "leftItems": ["اختياري"],
      "rightTitle": "اختياري",
      "rightItems": ["اختياري"],
      "question": "اختياري",
      "answer": "اختياري"
    }
  ]
}

أنشئ 8 إلى 12 شريحة.
اجعل العرض بصريًا وقليل الحشو ومناسبًا للطالب.
ابدأ بغلاف ثم ما سيتعلمه الطالب ثم المفاهيم.
استخدم المقارنة أو النشاط عندما يناسب الدرس.
اختم بمراجعة أو تحقق من الفهم.
التزم بمحتوى الدرس فقط.
لا تنسخ نصوصًا طويلة.
لا تضف معلومات غير موجودة في الدرس.
لا تستخدم شعار وزارة أو جهة رسمية.
${
  custom
    ? "هذه نسخة مخصصة جديدة بالذكاء الاصطناعي."
    : "هذه شرائح الدرس الأساسية."
}
`.trim();
}

function preferredSlideProviders() {
  const configured = String(
    process.env.AI_SLIDE_PROVIDER_ORDER ??
      "",
  )
    .split(/[,\n;]+/u)
    .map((item) => item.trim())
    .filter(Boolean);

  return configured.length
    ? configured
    : [
        "gemini",
        "openrouter",
        "anthropic",
        "groq",
        "ollama",
      ];
}

async function generateAndCacheCoreSlides(
  lesson: LessonRow,
) {
  const db = adminClient();

  if (!db) return;

  const result =
    await runAgentJson<Deck>({
      agent: "slide-designer",
      profile: "quality",
      preferredProviders:
        preferredSlideProviders(),
      maxTokens: 3200,
      context: [
        `عنوان الدرس: ${lesson.title}`,
        lesson.summary
          ? `الملخص الحالي: ${lesson.summary}`
          : "",
        lesson.content
          ? `محتوى الدرس:\n${String(
              lesson.content,
            ).slice(0, 18000)}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      prompt:
        slidePrompt(false),
    });

  if (
    !result.data?.slides?.length
  ) {
    return;
  }

  await db
    .from(
      "edu_lesson_ai_artifacts",
    )
    .upsert(
      {
        lesson_id:
          lesson.id,
        kind: "slides",
        prompt_version:
          SLIDE_PROMPT_VERSION,
        content:
          result.data,
        provider:
          result.provider,
        model:
          result.model,
        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "lesson_id,kind,prompt_version",
      },
    );
}

function usageFeature(
  task: Task,
) {
  if (
    task ===
    "custom_summary"
  ) {
    return "custom_summary";
  }

  if (
    task ===
    "custom_slides"
  ) {
    return "custom_pptx";
  }

  if (
    task === "flashcards"
  ) {
    return "flashcards";
  }

  if (
    task === "study_guide"
  ) {
    return "study_guide";
  }

  if (
    task === "concept_map"
  ) {
    return "concept_map";
  }

  if (
    task ===
    "notebook_answer"
  ) {
    return "notebook_answer";
  }

  return null;
}

function promptFor(
  task: Task,
  question: string,
) {
  if (
    task === "summary" ||
    task === "custom_summary"
  ) {
    return `
أعد JSON:
{
  "shortSummary": "ملخص واضح من 3-5 جمل",
  "keyPoints": ["نقطة 1","نقطة 2"],
  "reviewQuestions": ["سؤال 1","سؤال 2","سؤال 3"]
}
${
  task === "custom_summary"
    ? "هذه نسخة مخصصة جديدة بالذكاء الاصطناعي، غيّر الصياغة مع بقاء المعنى مرتبطًا بالدرس."
    : "هذا هو ملخص الدرس الأساسي."
}
`.trim();
  }

  if (
    task === "slides" ||
    task === "custom_slides"
  ) {
    return slidePrompt(
      task ===
        "custom_slides",
    );
  }

  if (
    task === "flashcards"
  ) {
    return `
أعد JSON:
{
  "cards": [
    {
      "front": "سؤال أو مصطلح",
      "back": "إجابة مختصرة"
    }
  ]
}
أنشئ 8-12 بطاقة.
`.trim();
  }

  if (
    task === "study_guide"
  ) {
    return `
أعد JSON:
{
  "whatToLearn": ["..."],
  "commonMistakes": ["..."],
  "practicePlan": ["..."],
  "selfCheck": ["..."]
}
`.trim();
  }

  if (
    task === "concept_map"
  ) {
    return `
أعد JSON:
{
  "center": "المفهوم المركزي",
  "branches": [
    {
      "title": "فرع",
      "items": ["عنصر","عنصر"]
    }
  ]
}
`.trim();
  }

  if (
    task ===
    "video_storyboard"
  ) {
    return `
أعد JSON لسيناريو فيديو من 5-8 مشاهد:
{
  "title": "عنوان الفيديو",
  "slides": [
    {
      "title": "عنوان المشهد",
      "bullets": ["نقطة","نقطة"],
      "narration": "تعليق صوتي عربي قصير لا يتجاوز 450 حرفًا",
      "seconds": 8
    }
  ]
}

تعليمات المستخدم للفيديو:
${question || "أنشئ فيديو تعليمي واضح ومختصر اعتمادًا على سياق الدرس الحالي."}

اتبع برومبت المستخدم في الأسلوب والترتيب والأمثلة ما دام مناسبًا.
لا تنسخ نصوصًا طويلة من الكتاب.
`.trim();
  }

  return `
سؤال الطالب:
${question}

أجب بالعربية اعتمادًا على الدرس فقط.
إذا لم تجد الإجابة في الدرس قل:
«هذه المعلومة غير موجودة في الدرس الحالي».
`.trim();
}

function agentFor(
  task: Task,
) {
  if (
    task === "slides" ||
    task === "custom_slides"
  ) {
    return "slide-designer" as const;
  }

  if (
    task ===
    "video_storyboard"
  ) {
    return "video-director" as const;
  }

  if (
    task ===
    "notebook_answer"
  ) {
    return "notebook-tutor" as const;
  }

  return "study-summarizer" as const;
}

function cacheKind(
  task: Task,
) {
  if (
    task === "summary" ||
    task === "slides" ||
    task === "flashcards" ||
    task === "study_guide" ||
    task === "concept_map" ||
    task ===
      "video_storyboard"
  ) {
    return task;
  }

  return null;
}

function promptVersion(
  task: Task,
) {
  return task === "slides"
    ? SLIDE_PROMPT_VERSION
    : "stage4-core-v1";
}

export async function POST(
  request: Request,
) {
  try {
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
            "يجب تسجيل الدخول.",
        },
        {
          status: 401,
        },
      );
    }

    const body =
      (await request.json()) as {
        lessonId?: string;
        task?: Task;
        question?: string;
        refresh?: boolean;
      };

    const lessonId =
      String(
        body.lessonId ?? "",
      ).trim();

    const task = body.task;
    const question =
      String(
        body.question ?? "",
      ).trim();

    if (
      !lessonId ||
      !task
    ) {
      return NextResponse.json(
        {
          error:
            "الدرس أو الأداة غير محددة.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("lessons")
        .select(
          "id,title,summary,content,learning_objectives,vocabulary,instructions",
        )
        .eq(
          "id",
          lessonId,
        )
        .eq(
          "status",
          "published",
        )
        .maybeSingle();

    if (
      error ||
      !data
    ) {
      return NextResponse.json(
        {
          error:
            "الدرس غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    const lesson: LessonRow = {
      id:
        String(data.id),
      title:
        String(
          data.title ?? "",
        ),
      summary:
        data.summary
          ? String(
              data.summary,
            )
          : null,
      content:
        data.content
          ? String(data.content)
          : null,
      learning_objectives: data.learning_objectives,
      vocabulary: data.vocabulary,
      instructions: data.instructions,
    };

    if (
      task === "summary" &&
      lesson.summary &&
      !body.refresh
    ) {
      return NextResponse.json(
        {
          data: {
            shortSummary:
              lesson.summary,
            keyPoints: [],
            reviewQuestions: [],
          },
          provider: "lesson",
          model:
            "stored-summary",
          cached: true,
          coreLessonAsset: true,
        },
      );
    }

    const db =
      adminClient();

    const kind =
      task === "video_storyboard" && question
        ? null
        : cacheKind(task);

    if (
      db &&
      kind &&
      task !== "slides" &&
      !body.refresh
    ) {
      const {
        data: cached,
      } =
        await db
          .from(
            "edu_lesson_ai_artifacts",
          )
          .select(
            "content,provider,model",
          )
          .eq(
            "lesson_id",
            lessonId,
          )
          .eq(
            "kind",
            kind,
          )
          .eq(
            "prompt_version",
            promptVersion(task),
          )
          .maybeSingle();

      if (
        cached?.content
      ) {
        return NextResponse.json(
          {
            data:
              cached.content,
            provider:
              cached.provider ??
              "cache",
            model:
              cached.model ??
              "cache",
            cached: true,
            coreLessonAsset:
              task === "summary" ||
              task === "slides",
          },
        );
      }
    }

    if (
      task === "slides" &&
      !body.refresh
    ) {
      const { data: activityRows } = await supabase
        .from("lesson_activities")
        .select("instructions,title")
        .eq("lesson_id", lessonId)
        .eq("is_published", true)
        .limit(5);
      const actualTasks = (activityRows ?? [])
        .map((row) => typeof row.instructions === "string" && row.instructions.trim()
          ? row.instructions : row.title)
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
      const grounded = fallbackDeck({
        ...lesson,
        instructions: [
          ...(Array.isArray(lesson.instructions) ? lesson.instructions : []),
          ...actualTasks,
        ],
      });
      if (!grounded) {
        return NextResponse.json(
          { error: "الدرس يحتاج استكمال شرحه قبل إنشاء عرض تعليمي موثوق." },
          { status: 422 },
        );
      }
      // Zero-cost default. Optional background AI remains disabled unless
      // the owner enables it explicitly; its cache is not used for core slides.
      if (process.env.DADYOOM_SLIDE_AI_ENRICH === "1") {
        after(async () => {
          try {
            await generateAndCacheCoreSlides(lesson);
          } catch (error) {
            console.error("CORE_SLIDES_BACKGROUND_ENRICH_FAILED", {
              lessonId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        });
      }
      return NextResponse.json({
        data: grounded,
        provider: "dadyoom-lesson-data",
        model: "evidence-deck-v2",
        cached: false,
        coreLessonAsset: true,
        enrichingInBackground: process.env.DADYOOM_SLIDE_AI_ENRICH === "1",
      });
    }

    const feature =
      usageFeature(task);

    if (feature) {
      const access =
        await consumeFeature(
          feature,
        );

      if (
        !access.allowed
      ) {
        return NextResponse.json(
          {
            error:
              `وصلت إلى حدك اليومي لهذه الميزة (${access.limit}). ` +
              "يمكنك المتابعة غدًا أو الترقية إلى Plus.",
            plan:
              access.plan,
            remaining:
              access.remaining,
          },
          {
            status: 429,
          },
        );
      }
    }

    const context = [
      `عنوان الدرس: ${lesson.title}`,
      lesson.summary
        ? `الملخص الحالي: ${lesson.summary}`
        : "",
      lesson.content
        ? `محتوى الدرس:\n${String(
            lesson.content,
          ).slice(0, 18000)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const profile =
      task === "slides" ||
      task ===
        "custom_slides" ||
      task ===
        "video_storyboard"
        ? "quality"
        : "economy";

    if (
      task ===
      "notebook_answer"
    ) {
      const result =
        await runAgent({
          agent:
            agentFor(task),
          context,
          profile,
          maxTokens: 1200,
          prompt:
            promptFor(
              task,
              question,
            ),
        });

      return NextResponse.json(
        {
          data: {
            answer:
              result.text,
          },
          provider:
            result.provider,
          model:
            result.model,
          cached: false,
        },
      );
    }

    const result =
      await runAgentJson<
        Record<
          string,
          unknown
        >
      >({
        agent:
          agentFor(task),
        context,
        profile,
        preferredProviders:
          task === "slides" ||
          task ===
            "custom_slides"
            ? preferredSlideProviders()
            : undefined,
        maxTokens:
          task ===
          "video_storyboard"
            ? 3200
            : task ===
                "slides" ||
              task ===
                "custom_slides"
              ? 3200
              : 2400,
        prompt:
          promptFor(
            task,
            question,
          ),
      });

    if (
      db &&
      kind
    ) {
      await db
        .from(
          "edu_lesson_ai_artifacts",
        )
        .upsert(
          {
            lesson_id:
              lessonId,
            kind,
            prompt_version:
              promptVersion(
                task,
              ),
            content:
              result.data,
            provider:
              result.provider,
            model:
              result.model,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "lesson_id,kind,prompt_version",
          },
        );
    }

    return NextResponse.json(
      {
        data:
          result.data,
        provider:
          result.provider,
        model:
          result.model,
        cached: false,
        coreLessonAsset:
          task === "summary" ||
          task === "slides",
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر تشغيل أداة الدراسة.",
      },
      {
        status: 500,
      },
    );
  }
}