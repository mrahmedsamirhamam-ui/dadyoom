import { NextResponse } from "next/server";
import PptxGenJS from "@lofcz/pptxgenjs";

import { createClient } from "@/lib/supabase/server";
import { buildEvidenceDeck, type GroundedLesson } from "@/lib/lesson/evidence-slide-deck";

export const runtime = "nodejs";

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
          "id,title,summary,content,learning_objectives,vocabulary,instructions",
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

    const lesson: GroundedLesson = {
      id: String(data.id),
      title: String(data.title ?? ""),
      summary: typeof data.summary === "string" ? data.summary : null,
      content: typeof data.content === "string" ? data.content : null,
      learning_objectives: data.learning_objectives,
      vocabulary: data.vocabulary,
      instructions: data.instructions,
    };

    // Build from stored lesson evidence on each request. Do not use old
    // cached AI decks that may contain generic or unsupported explanations.
    const deck = buildEvidenceDeck(lesson);
    if (!deck) {
      return NextResponse.json(
        { error: "هذا الدرس لا يحتوي بعد على مادة تعليمية كافية لإنشاء عرض موثوق. يحتاج مراجعة واستكمالًا." },
        { status: 422 },
      );
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
