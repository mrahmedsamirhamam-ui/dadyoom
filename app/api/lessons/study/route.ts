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

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/[\r\t]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function sourceSentences(
  lesson: LessonRow,
) {
  const rows = [
    lesson.summary ?? "",
    lesson.content ?? "",
  ]
    .join("\n")
    .split(/[.!؟!\n؛]+/u)
    .map(cleanText)
    .filter(
      (item) =>
        item.length >= 18 &&
        item.length <= 180,
    );

  return [
    ...new Set(rows),
  ].slice(0, 24);
}

function fallbackDeck(
  lesson: LessonRow,
): Deck {
  const source =
    sourceSentences(lesson);

  const rows = source.length
    ? source
    : [
        `هذا العرض يراجع أهم أفكار درس ${lesson.title}.`,
        "اقرأ الفكرة ثم حاول شرحها بأسلوبك.",
        "اربط بين المفردات والمعنى العام للدرس.",
        "راجع الأسئلة في النهاية لتقيس فهمك.",
      ];

  const slides: RichSlide[] = [
    {
      kind: "cover",
      title: lesson.title,
      subtitle:
        "عرض ضاديوم للدرس • مبني على محتوى الدرس",
      bullets: [],
    },
    {
      kind: "objectives",
      title: "ماذا سنتعلم؟",
      bullets: [
        "فهم الفكرة الرئيسية للدرس.",
        "تفسير الكلمات والمعاني في السياق.",
        "ربط الأفكار بالأمثلة والأسئلة.",
        "مراجعة الفهم بأسلوب مختصر وواضح.",
      ],
    },
    {
      kind: "concept",
      title: "الفكرة الأساسية",
      callout:
        cleanText(
          lesson.summary ??
            rows[0] ??
            "",
        ),
      bullets:
        rows.slice(0, 4),
    },
  ];

  if (rows.length > 4) {
    slides.push({
      kind: "concept",
      title: "نفهم أكثر",
      bullets:
        rows.slice(4, 8),
    });
  }

  if (rows.length > 8) {
    slides.push({
      kind: "concept",
      title: "أفكار مهمة",
      bullets:
        rows.slice(8, 12),
    });
  }

  if (rows.length >= 6) {
    slides.push({
      kind: "compare",
      title: "نقارن ونفهم",
      leftTitle: "الفكرة",
      leftItems:
        rows.slice(0, 3),
      rightTitle:
        "ما يرتبط بها",
      rightItems:
        rows.slice(3, 6),
      bullets: [],
    });
  }

  slides.push(
    {
      kind: "activity",
      title: "فكر وأجب",
      question:
        "ما أهم فكرة فهمتها من الدرس؟",
      answer:
        "اكتب إجابتك بأسلوبك ثم ارجع إلى الدرس للمراجعة.",
      bullets:
        rows.slice(0, 3),
    },
    {
      kind: "review",
      title: "مراجعة سريعة",
      bullets: [
        ...rows.slice(-4),
        "أستطيع الآن تلخيص الدرس بأسلوبي.",
      ],
    },
  );

  return {
    title: lesson.title,
    slides:
      slides.slice(0, 10),
  };
}


function fallbackVideoStoryboard(
  lesson: LessonRow,
): Deck {
  const source =
    sourceSentences(
      lesson,
    );

  const rows =
    source.length > 0
      ? source
      : [
          `نتعلم اليوم أهم أفكار درس ${lesson.title}.`,
          "نقرأ الفكرة الأساسية ثم نوضحها بمثال قصير.",
          "نراجع المفردات المهمة داخل السياق.",
          "نختم بسؤال سريع لنتأكد من الفهم.",
        ];

  const slides: RichSlide[] = [
    {
      title:
        lesson.title,
      bullets: [
        "فيديو ضاديوم التعليمي",
      ],
      narration:
        `مرحبًا بك في ضاديوم. في هذا الفيديو سنتعلم درس ${lesson.title} بطريقة سهلة ومختصرة.`,
      seconds: 7,
    },
    {
      title:
        "الفكرة الأساسية",
      bullets:
        rows.slice(0, 3),
      narration:
        rows.slice(0, 3).join(". "),
      seconds: 10,
    },
    {
      title:
        "نفهم أكثر",
      bullets:
        rows.slice(3, 6).length
          ? rows.slice(3, 6)
          : rows.slice(0, 3),
      narration:
        (
          rows.slice(3, 6).length
            ? rows.slice(3, 6)
            : rows.slice(0, 3)
        ).join(". "),
      seconds: 10,
    },
    {
      title:
        "مفاتيح الدرس",
      bullets:
        rows.slice(6, 9).length
          ? rows.slice(6, 9)
          : [
              "اقرأ الفكرة بصوت واضح.",
              "اربط بين الكلمات والمعنى.",
              "حاول شرح الفكرة بأسلوبك.",
            ],
      narration:
        "ركز على الكلمات المهمة، واربط كل كلمة بالمعنى العام للدرس.",
      seconds: 9,
    },
    {
      title:
        "تطبيق سريع",
      bullets: [
        "اذكر أهم فكرة تعلمتها.",
        "اختر كلمة جديدة واشرح معناها.",
        "كوّن جملة مرتبطة بالدرس.",
      ],
      narration:
        "توقف قليلًا وحاول الإجابة بنفسك: ما أهم فكرة تعلمتها من هذا الدرس؟",
      seconds: 9,
    },
    {
      title:
        "مراجعة",
      bullets:
        rows.slice(-3),
      narration:
        "راجع هذه النقاط، ثم أكمل أسئلة ضاديوم التفاعلية للتأكد من فهمك.",
      seconds: 8,
    },
  ];

  return {
    title:
      lesson.title,
    slides,
  };
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
          "id,title,summary,content",
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
          ? String(
              data.content,
            )
          : null,
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
      cacheKind(task);

    if (
      db &&
      kind &&
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
      after(async () => {
        try {
          await generateAndCacheCoreSlides(
            lesson,
          );
        } catch (error) {
          console.error(
            "CORE_SLIDES_BACKGROUND_ENRICH_FAILED",
            {
              lessonId,
              error:
                error instanceof Error
                  ? error.message
                  : String(
                      error,
                    ),
            },
          );
        }
      });

      return NextResponse.json(
        {
          data:
            fallbackDeck(
              lesson,
            ),
          provider:
            "dadyoom-instant",
          model:
            "source-grounded-v1",
          cached: false,
          coreLessonAsset: true,
          enrichingInBackground:
            true,
        },
      );
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

    let result;

    try {
      result =
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
    } catch (error) {
      if (
        task !==
        "video_storyboard"
      ) {
        throw error;
      }

      console.error(
        "VIDEO_DIRECTOR_AGENT_FALLBACK",
        error instanceof Error
          ? error.message
          : error,
      );

      const fallback =
        fallbackVideoStoryboard(
          lesson,
        );

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
                fallback,
              provider:
                "dadyoom-fallback",
              model:
                "source-grounded-video-v1",
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
            fallback,
          provider:
            "dadyoom-fallback",
          model:
            "source-grounded-video-v1",
          cached: false,
          degraded: true,
        },
      );
    }

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
    console.error(
      "LESSON_STUDY_INTERNAL_ERROR",
      error instanceof Error
        ? error.message
        : error,
    );

    return NextResponse.json(
      {
        error:
          "تعذر تشغيل أداة الدراسة الآن. حاول مرة أخرى بعد قليل.",
      },
      {
        status: 503,
      },
    );
  }
}
