"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Button,
} from "@/components/ui/button";

type LessonItem = {
  id: string;
  title: string;
  folderNumber: number;
  sourcePageStart: number;
  sourcePageEnd: number;
};

type Props = {
  lessons: LessonItem[];
};

type JsonObject =
  Record<string, unknown>;

type LessonResult = {
  id: string;
  title: string;
  status:
    | "pending"
    | "building"
    | "complete"
    | "skipped"
    | "failed";
  inserted: number;
  message: string;
};

function isObject(
  value: unknown
): value is JsonObject {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function sleep(
  ms: number
) {
  return new Promise<void>(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}

async function readJson(
  response: Response
): Promise<JsonObject> {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    const value =
      JSON.parse(text);

    return isObject(value)
      ? value
      : {};
  }
  catch {
    throw new Error(
      `استجابة غير صالحة: ${text.slice(0, 300)}`
    );
  }
}

export default function AutoBuildAllLessons({
  lessons,
}: Props) {
  const router =
    useRouter();

  const [
    running,
    setRunning,
  ] =
    useState(false);

  const [
    currentStatus,
    setCurrentStatus,
  ] =
    useState(
      "جاهز لبناء الدروس غير المبنية."
    );

  const [
    results,
    setResults,
  ] =
    useState<LessonResult[]>(
      []
    );

  function updateResult(
    id: string,
    patch: Partial<LessonResult>
  ) {
    setResults(
      current =>
        current.map(
          row =>
            row.id === id
              ? {
                  ...row,
                  ...patch,
                }
              : row
        )
    );
  }

  async function getActivityCount(
    lessonId: string
  ) {
    const response =
      await fetch(
        "/api/admin/lessons/activity-count",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              lessonId,
            }),

          cache:
            "no-store",
        }
      );

    const data =
      await readJson(
        response
      );

    if (
      !response.ok ||
      data.success !== true
    ) {
      throw new Error(
        typeof data.error ===
        "string"
          ? data.error
          : "تعذر معرفة حالة الدرس."
      );
    }

    return Number(
      data.count ?? 0
    );
  }

  async function preparePages(
    lesson: LessonItem,
    imageBaseUrl: string
  ) {
    const response =
      await fetch(
        "/api/admin/lessons/prepare-source-pages",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              imageBaseUrl,

              sourcePageStart:
                lesson.sourcePageStart,

              sourcePageEnd:
                lesson.sourcePageEnd,
            }),

          cache:
            "no-store",
        }
      );

    const data =
      await readJson(
        response
      );

    if (
      !response.ok ||
      data.success !== true
    ) {
      throw new Error(
        typeof data.error ===
        "string"
          ? data.error
          : "تعذر تجهيز صور الدرس."
      );
    }
  }

  async function getPlan(
    lessonId: string,
    imageBaseUrl: string
  ) {
    const response =
      await fetch(
        "/api/admin/lessons/analyze-lesson",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              lessonId,
              imageBaseUrl,
              batchSize: 4,
              batchIndex: 0,
              planOnly: true,
            }),

          cache:
            "no-store",
        }
      );

    const data =
      await readJson(
        response
      );

    if (
      !response.ok ||
      data.success !== true
    ) {
      throw new Error(
        typeof data.error ===
        "string"
          ? data.error
          : "تعذر إنشاء خطة الدرس."
      );
    }

    const plan =
      isObject(
        data.plan
      )
        ? data.plan
        : {};

    return Array.isArray(
      plan.batches
    )
      ? plan.batches
      : [];
  }

  async function analyzeBatch(
    lessonId: string,
    imageBaseUrl: string,
    batchIndex: number
  ) {
    const maxAttempts =
      3;

    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt++
    ) {
      const response =
        await fetch(
          "/api/admin/lessons/analyze-lesson",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                lessonId,
                imageBaseUrl,
                batchSize: 4,
                batchIndex,
                planOnly: false,
              }),

            cache:
              "no-store",
          }
        );

      const data =
        await readJson(
          response
        );

      if (
        response.ok &&
        data.success === true
      ) {
        return;
      }

      const message =
        typeof data.error ===
        "string"
          ? data.error
          : `HTTP ${response.status}`;

      if (
        attempt ===
        maxAttempts
      ) {
        throw new Error(
          message
        );
      }

      await sleep(
        attempt * 10000
      );
    }
  }

  async function processCandidates(
    lessonId: string,
    apply: boolean
  ) {
    const response =
      await fetch(
        "/api/admin/lessons/create-reject-candidates",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              lessonId,
              apply,
            }),

          cache:
            "no-store",
        }
      );

    const data =
      await readJson(
        response
      );

    if (
      !response.ok ||
      data.success !== true
    ) {
      throw new Error(
        typeof data.error ===
        "string"
          ? data.error
          : "تعذر معالجة الأنشطة."
      );
    }

    return data;
  }

  async function buildLesson(
    lesson: LessonItem
  ) {
    const imageBaseUrl =
      `/curriculum/bahrain/grade-01/lesson-${String(
        lesson.folderNumber
      ).padStart(
        2,
        "0"
      )}`;

    setCurrentStatus(
      `تجهيز ${lesson.title}...`
    );

    await preparePages(
      lesson,
      imageBaseUrl
    );

    const batches =
      await getPlan(
        lesson.id,
        imageBaseUrl
      );

    if (
      batches.length === 0
    ) {
      throw new Error(
        "لا توجد دفعات قابلة للتحليل."
      );
    }

    let totalInserted =
      0;

    for (
      let batchIndex = 0;
      batchIndex < batches.length;
      batchIndex++
    ) {
      setCurrentStatus(
        `${lesson.title}: تحليل الدفعة ${
          batchIndex + 1
        } من ${batches.length}...`
      );

      await analyzeBatch(
        lesson.id,
        imageBaseUrl,
        batchIndex
      );

      const preview =
        await processCandidates(
          lesson.id,
          false
        );

      const summary =
        isObject(
          preview.summary
        )
          ? preview.summary
          : {};

      const eligible =
        Number(
          summary.eligible ??
          0
        );

      if (
        eligible > 0
      ) {
        const applied =
          await processCandidates(
            lesson.id,
            true
          );

        const applySummary =
          isObject(
            applied.summary
          )
            ? applied.summary
            : {};

        totalInserted +=
          Number(
            applySummary.inserted ??
            0
          );
      }

      if (
        batchIndex <
        batches.length - 1
      ) {
        await sleep(
          8000
        );
      }
    }

    return totalInserted;
  }

  async function startAll() {
    if (running) {
      return;
    }

    setRunning(
      true
    );

    setResults(
      lessons.map(
        lesson => ({
          id:
            lesson.id,
          title:
            lesson.title,
          status:
            "pending",
          inserted:
            0,
          message:
            "في الانتظار",
        })
      )
    );

    try {
      for (
        let index = 0;
        index < lessons.length;
        index++
      ) {
        const lesson =
          lessons[index];

        try {
          setCurrentStatus(
            `فحص ${lesson.title}...`
          );

          const count =
            await getActivityCount(
              lesson.id
            );

          if (
            count > 0
          ) {
            updateResult(
              lesson.id,
              {
                status:
                  "skipped",

                message:
                  `تم التخطي — يحتوي بالفعل على ${count} نشاطًا.`,
              }
            );

            continue;
          }

          updateResult(
            lesson.id,
            {
              status:
                "building",
              message:
                "جارٍ البناء...",
            }
          );

          const inserted =
            await buildLesson(
              lesson
            );

          updateResult(
            lesson.id,
            {
              status:
                "complete",

              inserted,

              message:
                `اكتمل — أضيف ${inserted} نشاطًا.`,
            }
          );
        }
        catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "خطأ غير معروف";

          updateResult(
            lesson.id,
            {
              status:
                "failed",

              message:
                `فشل: ${message}`,
            }
          );

          /*
           * Stop the whole curriculum build
           * on the first unexpected lesson error.
           */
          setCurrentStatus(
            `توقف البناء عند: ${lesson.title}`
          );

          throw error;
        }

        if (
          index <
          lessons.length - 1
        ) {
          setCurrentStatus(
            "الانتقال إلى الدرس التالي..."
          );

          await sleep(
            10000
          );
        }
      }

      setCurrentStatus(
        "✅ اكتمل بناء جميع الدروس غير المبنية."
      );

      router.refresh();
    }
    catch {
      /*
       * Error is already displayed
       * in the corresponding lesson row.
       */
    }
    finally {
      setRunning(
        false
      );
    }
  }

  const statusLabel = (
    status: LessonResult["status"]
  ) => {
    switch (status) {
      case "building":
        return "⏳ جارٍ";
      case "complete":
        return "✅ مكتمل";
      case "skipped":
        return "↪️ متخطى";
      case "failed":
        return "❌ فشل";
      default:
        return "• انتظار";
    }
  };

  return (
    <section
      className="rounded-2xl border bg-card p-5 shadow-sm"
      dir="rtl"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">
            🤖 بناء المنهج تلقائيًا
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            يبني دروس الصف الأول غير المبنية بالتتابع، ويجهز الصور ويحلل الدفعات ويمنع التكرار تلقائيًا.
          </p>
        </div>

        <Button
          type="button"
          disabled={
            running ||
            lessons.length === 0
          }
          onClick={
            startAll
          }
        >
          {running
            ? "جارٍ بناء المنهج..."
            : "بناء جميع الدروس غير المبنية"}
        </Button>
      </div>

      <div className="mt-4 rounded-xl bg-muted/50 px-4 py-3 text-sm font-medium">
        {currentStatus}
      </div>

      {results.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[700px] text-right text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">
                  الدرس
                </th>

                <th className="p-2">
                  الحالة
                </th>

                <th className="p-2">
                  المضافة
                </th>

                <th className="p-2">
                  التفاصيل
                </th>
              </tr>
            </thead>

            <tbody>
              {results.map(
                row => (
                  <tr
                    key={
                      row.id
                    }
                    className="border-b last:border-0"
                  >
                    <td className="p-2 font-bold">
                      {row.title}
                    </td>

                    <td className="p-2">
                      {statusLabel(
                        row.status
                      )}
                    </td>

                    <td className="p-2 font-bold">
                      {row.inserted}
                    </td>

                    <td className="p-2">
                      {row.message}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
