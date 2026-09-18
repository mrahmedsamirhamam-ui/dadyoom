import {
  createClient as createAdminClient,
} from "@supabase/supabase-js";
import {
  after,
  NextResponse,
} from "next/server";
import PptxGenJS from "@lofcz/pptxgenjs";

import {
  createClient,
} from "@/lib/supabase/server";
import {
  runAgentJson,
} from "@/lib/ai/agents";

export const runtime = "nodejs";

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

const PROMPT_VERSION =
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

async function enrichDeck(
  lesson: LessonRow,
) {
  const db = adminClient();

  if (!db) return;

  const generated =
    await runAgentJson<Deck>({
      agent: "slide-designer",
      profile: "quality",
      preferredProviders:
        preferredSlideProviders(),
      maxTokens: 3200,
      context: [
        `عنوان الدرس: ${lesson.title}`,
        lesson.summary
          ? `الملخص: ${lesson.summary}`
          : "",
        lesson.content
          ? `المحتوى:\n${String(
              lesson.content,
            ).slice(0, 18000)}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      prompt: `
أعد JSON صالحًا فقط لعرض عربي تعليمي حديث يشبه فكرة
Slide Deck المبني على المصادر: بصري، منظم، واضح، وقليل الحشو.
استخدم هوية ضاديوم بدل أي علامة رسمية.

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
ابدأ بغلاف ثم أهداف التعلم.
استخدم شرائح مفاهيم ومقارنة وأنشطة عندما يلائم الدرس.
اختم بمراجعة أو تحقق من الفهم.
التزم بمحتوى الدرس فقط.
لا تنسخ نصوصًا طويلة.
لا تضف معلومات غير موجودة.
لا تستخدم شعار وزارة أو جهة رسمية.
`.trim(),
    });

  if (
    !generated.data
      ?.slides?.length
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
          PROMPT_VERSION,
        content:
          generated.data,
        provider:
          generated.provider,
        model:
          generated.model,
        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "lesson_id,kind,prompt_version",
      },
    );
}

function bulletText(
  items: string[] | undefined,
) {
  return (items ?? [])
    .filter(Boolean)
    .slice(0, 6)
    .map(
      (item) =>
        `• ${item}`,
    )
    .join("\n");
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
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

    const { id } =
      await context.params;

    const {
      data,
      error,
    } =
      await supabase
        .from("lessons")
        .select(
          "id,title,summary,content",
        )
        .eq("id", id)
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

    const db =
      adminClient();

    let deck:
      | Deck
      | null = null;

    if (db) {
      const {
        data: cached,
      } =
        await db
          .from(
            "edu_lesson_ai_artifacts",
          )
          .select(
            "content",
          )
          .eq(
            "lesson_id",
            id,
          )
          .eq(
            "kind",
            "slides",
          )
          .eq(
            "prompt_version",
            PROMPT_VERSION,
          )
          .maybeSingle();

      if (
        cached?.content
      ) {
        deck =
          cached.content as Deck;
      }
    }

    if (
      !deck?.slides?.length
    ) {
      deck =
        fallbackDeck(lesson);

      after(async () => {
        try {
          await enrichDeck(
            lesson,
          );
        } catch (error) {
          console.error(
            "PPTX_BACKGROUND_ENRICH_FAILED",
            {
              lessonId:
                lesson.id,
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
    }

    const pptx =
      new PptxGenJS();

    pptx.layout =
      "LAYOUT_WIDE";
    pptx.rtlMode = true;
    pptx.author =
      "Dadyoom";
    pptx.company =
      "Dadyoom";
    pptx.title =
      lesson.title;
    pptx.subject =
      "Dadyoom Arabic lesson";
    pptx.theme = {
      headFontFace:
        "Arial",
      bodyFontFace:
        "Arial",
    };

    const total =
      deck.slides.length;

    deck.slides.forEach(
      (
        item,
        index,
      ) => {
        const slide =
          pptx.addSlide();

        const kind =
          item.kind ??
          "concept";

        if (
          kind === "cover"
        ) {
          slide.background = {
            color:
              "123F39",
          };

          slide.addShape(
            pptx.ShapeType.rect,
            {
              x: 0,
              y: 0,
              w: 13.33,
              h: 0.16,
              fill: {
                color:
                  "B68D46",
              },
              line: {
                color:
                  "B68D46",
                transparency:
                  100,
              },
            },
          );

          slide.addText(
            "ضاديوم",
            {
              x: 9.5,
              y: 0.6,
              w: 2.8,
              h: 0.5,
              fontFace:
                "Arial",
              fontSize: 18,
              bold: true,
              color:
                "F5CF7A",
              align:
                "right",
              rtlMode:
                true,
              margin: 0,
            },
          );

          slide.addText(
            item.title,
            {
              x: 0.95,
              y: 1.8,
              w: 11.4,
              h: 1.6,
              fontFace:
                "Arial",
              fontSize: 31,
              bold: true,
              color:
                "FFFFFF",
              align:
                "right",
              valign:
                "middle",
              rtlMode:
                true,
              margin:
                0.05,
              fit:
                "shrink",
            },
          );

          slide.addText(
            item.subtitle ??
              "عرض الدرس",
            {
              x: 0.95,
              y: 3.65,
              w: 11.4,
              h: 0.55,
              fontFace:
                "Arial",
              fontSize: 17,
              color:
                "F5E7C3",
              align:
                "right",
              rtlMode:
                true,
              margin: 0,
            },
          );
        } else {
          slide.background = {
            color:
              "FFFDF8",
          };

          slide.addText(
            item.title,
            {
              x: 0.75,
              y: 0.48,
              w: 11.8,
              h: 0.75,
              fontFace:
                "Arial",
              fontSize: 26,
              bold: true,
              color:
                "123F39",
              align:
                "right",
              rtlMode:
                true,
              margin:
                0.03,
              fit:
                "shrink",
            },
          );

          slide.addShape(
            pptx.ShapeType.rect,
            {
              x: 8.8,
              y: 1.28,
              w: 3.75,
              h: 0.05,
              fill: {
                color:
                  "B68D46",
              },
              line: {
                color:
                  "B68D46",
                transparency:
                  100,
              },
            },
          );

          if (
            kind ===
            "objectives"
          ) {
            const positions = [
              [6.85, 1.8],
              [0.75, 1.8],
              [6.85, 4.2],
              [0.75, 4.2],
            ] as const;

            (
              item.bullets ??
              []
            )
              .slice(0, 4)
              .forEach(
                (
                  text,
                  cardIndex,
                ) => {
                  const [
                    x,
                    y,
                  ] =
                    positions[
                      cardIndex
                    ];

                  slide.addShape(
                    pptx.ShapeType
                      .roundRect,
                    {
                      x,
                      y,
                      w: 5.7,
                      h: 1.65,
                      rectRadius:
                        0.08,
                      fill: {
                        color:
                          cardIndex %
                            2 ===
                          0
                            ? "EEF7F3"
                            : "FFF4D9",
                      },
                      line: {
                        color:
                          cardIndex %
                            2 ===
                          0
                            ? "9FC8BC"
                            : "D8B66B",
                        width: 1,
                      },
                    },
                  );

                  slide.addText(
                    text,
                    {
                      x:
                        x +
                        0.25,
                      y:
                        y +
                        0.22,
                      w: 5.2,
                      h: 1.15,
                      fontFace:
                        "Arial",
                      fontSize: 18,
                      bold: true,
                      color:
                        "173F38",
                      align:
                        "right",
                      valign:
                        "middle",
                      rtlMode:
                        true,
                      margin:
                        0.03,
                      fit:
                        "shrink",
                    },
                  );
                },
              );
          } else if (
            kind ===
              "compare" &&
            item.leftItems
              ?.length &&
            item.rightItems
              ?.length
          ) {
            const columns = [
              {
                x: 6.85,
                title:
                  item.rightTitle ??
                  "الجانب الثاني",
                rows:
                  item.rightItems,
                fill:
                  "EEF7F3",
              },
              {
                x: 0.75,
                title:
                  item.leftTitle ??
                  "الجانب الأول",
                rows:
                  item.leftItems,
                fill:
                  "FFF4D9",
              },
            ];

            for (
              const column
              of columns
            ) {
              slide.addShape(
                pptx.ShapeType
                  .roundRect,
                {
                  x:
                    column.x,
                  y: 1.8,
                  w: 5.7,
                  h: 4.8,
                  rectRadius:
                    0.08,
                  fill: {
                    color:
                      column.fill,
                  },
                  line: {
                    color:
                      "D6C49D",
                    width: 1,
                  },
                },
              );

              slide.addText(
                column.title,
                {
                  x:
                    column.x +
                    0.25,
                  y: 2.05,
                  w: 5.2,
                  h: 0.55,
                  fontFace:
                    "Arial",
                  fontSize: 19,
                  bold: true,
                  color:
                    "123F39",
                  align:
                    "right",
                  rtlMode:
                    true,
                  margin:
                    0.02,
                },
              );

              slide.addText(
                bulletText(
                  column.rows,
                ),
                {
                  x:
                    column.x +
                    0.25,
                  y: 2.8,
                  w: 5.1,
                  h: 3.25,
                  fontFace:
                    "Arial",
                  fontSize: 17,
                  color:
                    "403A31",
                  align:
                    "right",
                  valign:
                    "top",
                  rtlMode:
                    true,
                  margin:
                    0.06,
                  fit:
                    "shrink",
                },
              );
            }
          } else if (
            kind ===
              "activity" ||
            item.question
          ) {
            slide.addShape(
              pptx.ShapeType
                .roundRect,
              {
                x: 0.8,
                y: 1.8,
                w: 11.75,
                h: 1.45,
                rectRadius:
                  0.08,
                fill: {
                  color:
                    "123F39",
                },
                line: {
                  color:
                    "123F39",
                },
              },
            );

            slide.addText(
              item.question ??
                "فكر وأجب",
              {
                x: 1.05,
                y: 2.05,
                w: 11.2,
                h: 0.85,
                fontFace:
                  "Arial",
                fontSize: 22,
                bold: true,
                color:
                  "FFFFFF",
                align:
                  "right",
                valign:
                  "middle",
                rtlMode:
                  true,
                margin:
                  0.03,
                fit:
                  "shrink",
              },
            );

            if (
              item.answer
            ) {
              slide.addText(
                item.answer,
                {
                  x: 0.95,
                  y: 3.55,
                  w: 11.4,
                  h: 0.9,
                  fontFace:
                    "Arial",
                  fontSize: 18,
                  color:
                    "705A2C",
                  align:
                    "right",
                  rtlMode:
                    true,
                  margin:
                    0.04,
                  fit:
                    "shrink",
                },
              );
            }

            slide.addText(
              bulletText(
                item.bullets,
              ),
              {
                x: 0.95,
                y: 4.65,
                w: 11.35,
                h: 1.6,
                fontFace:
                  "Arial",
                fontSize: 16,
                color:
                  "403A31",
                align:
                  "right",
                valign:
                  "top",
                rtlMode:
                  true,
                margin:
                  0.05,
                fit:
                  "shrink",
              },
            );
          } else {
            if (
              item.callout
            ) {
              slide.addShape(
                pptx.ShapeType
                  .roundRect,
                {
                  x: 0.8,
                  y: 1.8,
                  w: 11.75,
                  h: 1.3,
                  rectRadius:
                    0.08,
                  fill: {
                    color:
                      "EEF7F3",
                  },
                  line: {
                    color:
                      "9FC8BC",
                    width: 1,
                  },
                },
              );

              slide.addText(
                item.callout,
                {
                  x: 1.05,
                  y: 2.05,
                  w: 11.2,
                  h: 0.82,
                  fontFace:
                    "Arial",
                  fontSize: 18,
                  bold: true,
                  color:
                    "173F38",
                  align:
                    "right",
                  rtlMode:
                    true,
                  margin:
                    0.03,
                  fit:
                    "shrink",
                },
              );
            }

            slide.addText(
              bulletText(
                item.bullets,
              ),
              {
                x: 0.95,
                y:
                  item.callout
                    ? 3.4
                    : 1.85,
                w: 11.35,
                h:
                  item.callout
                    ? 2.85
                    : 4.45,
                fontFace:
                  "Arial",
                fontSize:
                  kind ===
                  "review"
                    ? 18
                    : 19,
                color:
                  "403A31",
                align:
                  "right",
                valign:
                  "top",
                rtlMode:
                  true,
                margin:
                  0.06,
                fit:
                  "shrink",
              },
            );
          }
        }

        slide.addText(
          `ضاديوم • ${index + 1}/${total}`,
          {
            x: 0.65,
            y: 7.05,
            w: 12,
            h: 0.22,
            fontFace:
              "Arial",
            fontSize: 9,
            color:
              kind ===
              "cover"
                ? "E7D3A5"
                : "8C806C",
            align:
              "right",
            rtlMode:
              true,
            margin: 0,
          },
        );
      },
    );

    const output =
      await pptx.write({
        outputType:
          "uint8array",
      });

    if (
      !(
        output instanceof
        Uint8Array
      )
    ) {
      throw new Error(
        "PPTX_BINARY_OUTPUT_FAILED",
      );
    }

    const body =
      output.buffer.slice(
        output.byteOffset,
        output.byteOffset +
          output.byteLength,
      ) as ArrayBuffer;

    const fileName =
      `${lesson.title.replace(
        /[\\/:*?"<>|]+/gu,
        "-",
      )}.pptx`;

    return new NextResponse(
      body,
      {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition":
            `attachment; filename*=UTF-8''${encodeURIComponent(
              fileName,
            )}`,
          "Cache-Control":
            "private, no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر إنشاء PowerPoint.",
      },
      {
        status: 500,
      },
    );
  }
}
