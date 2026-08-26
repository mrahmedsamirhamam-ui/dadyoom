import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type RequestBody = {
  lessonId?: string;

  /*
   * رقم الدفعة:
   * 0 = أول أربع صفحات
   * 1 = الأربع التالية
   * وهكذا.
   */
  batchIndex?: number;

  /*
   * عدد الصفحات داخل الدفعة.
   * الحد الأقصى في analyze-pages هو 4.
   */
  batchSize?: number;

  /*
   * حاليًا نمرر مسار صور الدرس.
   * لاحقًا يمكن تخزينه في بيانات المنهج.
   */
  imageBaseUrl?: string;

  /*
   * true = إرجاع خطة الدرس فقط
   * بدون استدعاء Gemini.
   */
  planOnly?: boolean;
};

type ProposalRegion = {
  title?: string;
  activityType?: string;
  section?: string;
  instructions?: string;
  audioText?: string;

  x?: number;
  y?: number;
  width?: number;
  height?: number;

  content?: Record<
    string,
    unknown
  >;

  answer?: Record<
    string,
    unknown
  >;
};

type Proposal = {
  pageNumber?: number;

  imageUrl?:
    string | null;

  region?:
    ProposalRegion;

  matchedActivity?: {
    id?: string;
    activity_order?: number;
    title?: string;
  } | null;

  confidence?: number;

  decision?:
    "AUTO" |
    "REVIEW" |
    "REJECT" |
    string;
};

type AnalyzePagesResponse = {
  success?: boolean;

  lessonId?: string;

  requestedPages?: number[];

  returnedPages?: number[];

  summary?: {
    pagesRequested?: number;
    pagesReturned?: number;
    proposals?: number;
    auto?: number;
    review?: number;
    reject?: number;
  };

  results?: unknown[];

  auto?: Proposal[];
review?: Proposal[];
reject?: Proposal[];

  mode?: string;

  error?: string;
};

function cleanText(
  value: unknown,
  maxLength = 500
): string {
  return typeof value ===
    "string"
    ? value
        .trim()
        .slice(
          0,
          maxLength
        )
    : "";
}

export async function POST(
  request: Request
) {
  try {
    const supabase =
      await createClient();

    const {
      data: {
        user,
      },
    } =
      await supabase
        .auth
        .getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "يجب تسجيل الدخول.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: profile,
      error:
        profileError,
    } =
      await supabase
        .from("profiles")
        .select("role")
        .eq(
          "id",
          user.id
        )
        .single();

    if (
      profileError ||
      !profile ||
      String(
        profile.role ??
        ""
      )
        .trim()
        .toLowerCase() !==
        "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "هذه الخاصية متاحة للمدير فقط.",
        },
        {
          status: 403,
        }
      );
    }

    let body:
      RequestBody;

    try {
      body =
        (
          await request.json()
        ) as RequestBody;
    }
    catch {
      return NextResponse.json(
        {
          error:
            "بيانات الطلب غير صالحة.",
        },
        {
          status: 400,
        }
      );
    }

    const lessonId =
      cleanText(
        body.lessonId,
        100
      );

    if (!lessonId) {
      return NextResponse.json(
        {
          error:
            "lessonId مطلوب.",
        },
        {
          status: 400,
        }
      );
    }

    const batchSize =
      typeof body.batchSize ===
        "number"
        ? Math.max(
            1,
            Math.min(
              4,
              Math.round(
                body.batchSize
              )
            )
          )
        : 4;

    const batchIndex =
      typeof body.batchIndex ===
        "number"
        ? Math.max(
            0,
            Math.round(
              body.batchIndex
            )
          )
        : 0;

    const imageBaseUrl =
      cleanText(
        body.imageBaseUrl,
        1000
      ) ||
      "/curriculum/bahrain/grade-01/lesson-02";

    const {
      data: lesson,
      error:
        lessonError,
    } =
      await supabase
        .from("lessons")
        .select(`
          id,
          title,
          source_page_start,
          source_page_end
        `)
        .eq(
          "id",
          lessonId
        )
        .maybeSingle();

    if (
      lessonError
    ) {
      throw lessonError;
    }

    if (!lesson) {
      return NextResponse.json(
        {
          error:
            "الدرس غير موجود.",
        },
        {
          status: 404,
        }
      );
    }

    const pageStart =
      Number(
        lesson.source_page_start
      );

    const pageEnd =
      Number(
        lesson.source_page_end
      );

    if (
      !Number.isFinite(
        pageStart
      ) ||
      !Number.isFinite(
        pageEnd
      ) ||
      pageStart <= 0 ||
      pageEnd < pageStart
    ) {
      return NextResponse.json(
        {
          error:
            "حدود صفحات الدرس غير صالحة.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * نبني قائمة كل صفحات الدرس.
     */
    const allPages =
      Array.from(
        {
          length:
            pageEnd -
            pageStart +
            1,
        },
        (
          _,
          index
        ) =>
          pageStart +
          index
      );

    /*
     * نقسم الصفحات إلى دفعات.
     */
    const batches:
      number[][] = [];

    for (
      let index = 0;
      index <
        allPages.length;
      index += batchSize
    ) {
      batches.push(
        allPages.slice(
          index,
          index +
            batchSize
        )
      );
    }

    if (
      batchIndex >=
      batches.length
    ) {
      return NextResponse.json(
        {
          error:
            "رقم الدفعة خارج حدود الدرس.",

          batchIndex,

          totalBatches:
            batches.length,
        },
        {
          status: 400,
        }
      );
    }

    const currentPages =
      batches[
        batchIndex
      ];

    if (
      body.planOnly === true
    ) {
      return NextResponse.json(
        {
          success: true,

          lesson: {
            id:
              lesson.id,

            title:
              lesson.title,

            sourcePageStart:
              pageStart,

            sourcePageEnd:
              pageEnd,
          },

          plan: {
            totalPages:
              allPages.length,

            batchSize,

            totalBatches:
              batches.length,

            batches,
          },

          batch: {
            batchIndex,

            pages:
              currentPages,

            hasPrevious:
              batchIndex > 0,

            previousBatchIndex:
              batchIndex > 0
                ? batchIndex - 1
                : null,

            hasNext:
              batchIndex <
              batches.length - 1,

            nextBatchIndex:
              batchIndex <
              batches.length - 1
                ? batchIndex + 1
                : null,
          },

          mode:
            "plan",
        },
        {
          status: 200,
        }
      );
    }

    const pages =
      currentPages.map(
        (pageNumber) => {
          const padded =
            String(
              pageNumber
            ).padStart(
              3,
              "0"
            );

          return {
            pageNumber,

            imageUrl:
              `${imageBaseUrl}/page-${padded}.jpg`,
          };
        }
      );

    /*
     * IMPORTANT:
     *
     * كل Request إلى analyze-lesson
     * يشغل Batch واحد فقط.
     *
     * لا نشغل جميع الدفعات داخل Request
     * واحد حتى لا نعود لمشكلة
     * الاتصالات الطويلة.
     */
    const origin =
      new URL(
        request.url
      ).origin;

    const response =
      await fetch(
        `${origin}/api/admin/lessons/analyze-pages`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            cookie:
              request.headers.get(
                "cookie"
              ) ??
              "",
          },

          body:
            JSON.stringify({
              lessonId,
              pages,
            }),

          cache:
            "no-store",
        }
      );

    let data:
      AnalyzePagesResponse;

    try {
      data =
        (
          await response.json()
        ) as AnalyzePagesResponse;
    }
    catch {
      return NextResponse.json(
        {
          error:
            "تعذر قراءة نتيجة analyze-pages.",
        },
        {
          status: 502,
        }
      );
    }

    if (
      !response.ok ||
      data.success !==
        true
    ) {
      return NextResponse.json(
        {
          success: false,

          lesson: {
            id:
              lesson.id,

            title:
              lesson.title,

            sourcePageStart:
              pageStart,

            sourcePageEnd:
              pageEnd,
          },

          plan: {
            totalPages:
              allPages.length,

            batchSize,

            totalBatches:
              batches.length,

            batches,
          },

          batch: {
            batchIndex,

            pages:
              currentPages,

            hasPrevious:
              batchIndex > 0,

            previousBatchIndex:
              batchIndex > 0
                ? batchIndex -
                  1
                : null,

            hasNext:
              batchIndex <
              batches.length -
                1,

            nextBatchIndex:
              batchIndex <
              batches.length -
                1
                ? batchIndex +
                  1
                : null,
          },

          error:
            data.error ??
            `analyze-pages returned HTTP ${response.status}`,
        },
        {
          status:
            response.status,
        }
      );
    }

    /*
     * ???? ????? ??? ?????? ??? ???? ???????.
     *
     * ????? ????? ??? ?????? ??????
     * ??????? ??????? ??? ???????.
     */
    const proposalsToSave: Proposal[] =
      [
        ...(data.auto ?? []),
        ...(data.review ?? []),
        ...(data.reject ?? []),
      ];

    console.info(
      "LESSON_AI_SAVE_START:",
      {
        lessonId,
        batchIndex,

        pages:
          currentPages,

        auto:
          data.auto?.length ??
          0,

        review:
          data.review?.length ??
          0,

        reject:
          data.reject?.length ??
          0,

        total:
          proposalsToSave.length,
      }
    );


    const {
      error:
        deleteProposalsError,
    } =
      await supabase
        .from(
          "lesson_ai_analysis_proposals"
        )
        .delete()
        .eq(
          "lesson_id",
          lessonId
        )
        .eq(
          "batch_index",
          batchIndex
        );

    if (
      deleteProposalsError
    ) {
      throw new Error(
        `تعذر حذف مقترحات التحليل السابقة: ${deleteProposalsError.message}`
      );
    }

    if (
      proposalsToSave.length > 0
    ) {
      const rows =
        proposalsToSave.map(
          (proposal) => {
            const region =
              proposal.region ??
              {};

            const matched =
              proposal.matchedActivity ??
              null;

            const sourcePage =
              typeof proposal.pageNumber ===
                "number"
                ? proposal.pageNumber
                : currentPages[0];

            const confidence =
              typeof proposal.confidence ===
                "number"
                ? Math.max(
                    0,
                    Math.min(
                      100,
                      Math.round(
                        proposal.confidence
                      )
                    )
                  )
                : 0;

            const decision =
              proposal.decision ===
                "AUTO" ||
              proposal.decision ===
                "REVIEW" ||
              proposal.decision ===
                "REJECT"
                ? proposal.decision
                : "REJECT";

            return {
              lesson_id:
                lessonId,

              source_page:
                sourcePage,

              image_url:
                proposal.imageUrl ??
                null,

              detected_title:
                region.title ??
                null,

              detected_type:
                region.activityType ??
                null,

              section:
                region.section ??
                null,

              instructions:
                region.instructions ??
                null,

              audio_text:
                region.audioText ??
                null,

              region_x:
                typeof region.x ===
                  "number"
                  ? region.x
                  : null,

              region_y:
                typeof region.y ===
                  "number"
                  ? region.y
                  : null,

              region_width:
                typeof region.width ===
                  "number"
                  ? region.width
                  : null,

              region_height:
                typeof region.height ===
                  "number"
                  ? region.height
                  : null,

              content:
                region.content ??
                {},

              answer:
                region.answer ??
                {},

              matched_activity_id:
                matched?.id ??
                null,

              matched_activity_order:
                typeof matched?.activity_order ===
                  "number"
                  ? matched.activity_order
                  : null,

              matched_activity_title:
                matched?.title ??
                null,

              confidence,

              decision,

              batch_index:
                batchIndex,

              model_used:
                null,

              updated_at:
                new Date()
                  .toISOString(),
            };
          }
        );

      const {
        error:
          insertProposalsError,
      } =
        await supabase
          .from(
            "lesson_ai_analysis_proposals"
          )
          .insert(
            rows
          );
    console.info(
      "LESSON_AI_INSERT_RESULT:",
      {
        batchIndex,

        rows:
          rows.length,

        hasError:
          Boolean(
            insertProposalsError
          ),

        error:
          insertProposalsError?.message ??
          null,
      }
    );



      if (
        insertProposalsError
      ) {
        throw new Error(
          `تعذر حفظ مقترحات تحليل الأنشطة: ${insertProposalsError.message}`
        );
      }
    }

    console.info(
      "LESSON_AI_PROPOSALS_SAVED:",
      {
        lessonId,
        batchIndex,
        pages:
          currentPages,
        count:
          proposalsToSave.length,
      }
    );

    return NextResponse.json(
      {
        success: true,

        lesson: {
          id:
            lesson.id,

          title:
            lesson.title,

          sourcePageStart:
            pageStart,

          sourcePageEnd:
            pageEnd,
        },

        /*
         * خطة الدرس بالكامل.
         *
         * مثال للصفحات 22-34
         * وحجم 4:
         *
         * [22,23,24,25]
         * [26,27,28,29]
         * [30,31,32,33]
         * [34]
         */
        plan: {
          totalPages:
            allPages.length,

          batchSize,

          totalBatches:
            batches.length,

          batches,
        },

        /*
         * الدفعة التي تم تحليلها
         * في هذا الطلب فقط.
         */
        batch: {
          batchIndex,

          pages:
            currentPages,

          hasPrevious:
            batchIndex > 0,

          previousBatchIndex:
            batchIndex > 0
              ? batchIndex -
                1
              : null,

          hasNext:
            batchIndex <
            batches.length -
              1,

          nextBatchIndex:
            batchIndex <
            batches.length -
              1
              ? batchIndex +
                1
              : null,
        },

        /*
         * نتيجة analyze-pages
         * كما هي.
         */
        analysis:
          data,

        summary:
          data.summary ??
          null,

        auto:
          data.auto ??
          [],

        review:
          data.review ??
          [],

        reject:
          data.reject ??
          [],

        /*
         * لا يوجد أي UPDATE.
         */
        mode:
          "preview",

        next:
          batchIndex <
          batches.length -
            1
            ? {
                batchIndex:
                  batchIndex +
                  1,
              }
            : null,
      },
      {
        status: 200,
      }
    );
  }
  catch (error) {
    console.error(
      "ANALYZE_LESSON_BATCH_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر تحليل دفعة الدرس.",
      },
      {
        status: 500,
      }
    );
  }
}
