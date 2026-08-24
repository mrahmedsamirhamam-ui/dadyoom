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

type Props = {
  lessonId: string;
  imageBaseUrl: string;
  sourcePageStart: number;
  sourcePageEnd: number;
};

type BuildRow = {
  batch: number;
  pages: string;
  proposals: number;
  eligible: number;
  inserted: number;
};

type JsonObject =
  Record<string, unknown>;

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
    (resolve) =>
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
    const parsed =
      JSON.parse(text);

    return isObject(parsed)
      ? parsed
      : {};
  }
  catch {
    throw new Error(
      `استجابة غير صالحة من الخادم: ${text.slice(0, 500)}`
    );
  }
}

export default function AutoBuildLessonButton({
  lessonId,
  imageBaseUrl,
  sourcePageStart,
  sourcePageEnd,
}: Props) {
  const router =
    useRouter();

  const [
    running,
    setRunning,
  ] =
    useState(false);

  const [
    status,
    setStatus,
  ] =
    useState(
      "جاهز للبناء التلقائي."
    );

  const [
    rows,
    setRows,
  ] =
    useState<BuildRow[]>(
      []
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  async function analyzeBatch(
    batchIndex: number
  ) {
    const maxAttempts =
      3;

    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt++
    ) {
      setStatus(
        `تحليل الدفعة ${
          batchIndex + 1
        } — المحاولة ${attempt} من ${maxAttempts}...`
      );

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
                batchSize:
                  4,
                batchIndex,
                planOnly:
                  false,
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
        data.success ===
          true
      ) {
        return data;
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
          `فشل تحليل الدفعة ${
            batchIndex + 1
          }: ${message}`
        );
      }

      setStatus(
        `تعذر تحليل الدفعة ${
          batchIndex + 1
        }. إعادة المحاولة تلقائيًا...`
      );

      await sleep(
        attempt *
          10000
      );
    }

    throw new Error(
      "تعذر إكمال التحليل."
    );
  }

  async function processCandidates(
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
      data.success !==
        true
    ) {
      throw new Error(
        typeof data.error ===
        "string"
          ? data.error
          : "تعذر تجهيز الأنشطة الجديدة."
      );
    }

    return data;
  }

  async function startBuild() {
    if (running) {
      return;
    }

    setRunning(
      true
    );

    setRows(
      []
    );

    setErrorMessage(
      ""
    );

    try {
      /*
       * Ensure that every source JPG exists
       * before asking the AI to analyze the lesson.
       */
      setStatus(
        "تجهيز صور صفحات الدرس تلقائيًا..."
      );

      const sourceResponse =
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
                sourcePageStart,
                sourcePageEnd,
              }),

            cache:
              "no-store",
          }
        );

      const sourceData =
        await readJson(
          sourceResponse
        );

      if (
        !sourceResponse.ok ||
        sourceData.success !==
          true
      ) {
        throw new Error(
          typeof sourceData.error ===
          "string"
            ? sourceData.error
            : "تعذر تجهيز صور صفحات الدرس."
        );
      }

      /*
       * Then ask the server for the batch plan.
       */
      setStatus(
        "تم تجهيز الصور. قراءة خطة صفحات الدرس..."
      );

      const planResponse =
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
                batchSize:
                  4,
                batchIndex:
                  0,
                planOnly:
                  true,
              }),

            cache:
              "no-store",
          }
        );

      const planData =
        await readJson(
          planResponse
        );

      if (
        !planResponse.ok ||
        planData.success !==
          true
      ) {
        throw new Error(
          typeof planData.error ===
          "string"
            ? planData.error
            : "تعذر إنشاء خطة الدرس."
        );
      }

      const plan =
        isObject(
          planData.plan
        )
          ? planData.plan
          : {};

      const batches =
        Array.isArray(
          plan.batches
        )
          ? plan.batches
          : [];

      if (
        batches.length ===
        0
      ) {
        throw new Error(
          "لم يتم العثور على صفحات قابلة للتحليل."
        );
      }

      for (
        let batchIndex =
          0;
        batchIndex <
        batches.length;
        batchIndex++
      ) {
        const analysis =
          await analyzeBatch(
            batchIndex
          );

        const batch =
          isObject(
            analysis.batch
          )
            ? analysis.batch
            : {};

        const analysisObject =
          isObject(
            analysis.analysis
          )
            ? analysis.analysis
            : {};

        const summary =
          isObject(
            analysisObject.summary
          )
            ? analysisObject.summary
            : {};

        const pages =
          Array.isArray(
            batch.pages
          )
            ? batch.pages
                .map(
                  String
                )
                .join(
                  ", "
                )
            : "";

        /*
         * Preview candidates first.
         * Existing activities are detected
         * as duplicates and skipped.
         */
        setStatus(
          `فحص الأنشطة الجديدة للدفعة ${
            batchIndex + 1
          }...`
        );

        const preview =
          await processCandidates(
            false
          );

        const previewSummary =
          isObject(
            preview.summary
          )
            ? preview.summary
            : {};

        const eligible =
          Number(
            previewSummary.eligible ??
            0
          );

        let inserted =
          0;

        if (
          eligible >
          0
        ) {
          setStatus(
            `إضافة ${eligible} نشاطًا جديدًا من الدفعة ${
              batchIndex + 1
            }...`
          );

          const applied =
            await processCandidates(
              true
            );

          const applySummary =
            isObject(
              applied.summary
            )
              ? applied.summary
              : {};

          inserted =
            Number(
              applySummary.inserted ??
              0
            );
        }

        setRows(
          (current) => [
            ...current,
            {
              batch:
                batchIndex +
                1,

              pages,

              proposals:
                Number(
                  summary.proposals ??
                  0
                ),

              eligible,

              inserted,
            },
          ]
        );

        /*
         * Small pause protects the AI
         * endpoint from rapid consecutive calls.
         */
        if (
          batchIndex <
          batches.length -
            1
        ) {
          setStatus(
            `اكتملت الدفعة ${
              batchIndex + 1
            }. الانتقال تلقائيًا إلى التالية...`
          );

          await sleep(
            8000
          );
        }
      }

      setStatus(
        "✅ اكتمل بناء الدرس تلقائيًا."
      );

      router.refresh();
    }
    catch (
      error
    ) {
      const message =
        error instanceof
        Error
          ? error.message
          : "حدث خطأ غير معروف.";

      setErrorMessage(
        message
      );

      setStatus(
        "توقف البناء قبل الاكتمال."
      );
    }
    finally {
      setRunning(
        false
      );
    }
  }

  return (
    <section
      className="rounded-2xl border bg-card p-5 shadow-sm"
      dir="rtl"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">
            🤖 بناء الدرس تلقائيًا
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            يحلل جميع صفحات الدرس، يعيد المحاولة عند فشل الذكاء الاصطناعي، يمنع التكرار، ويضيف الأنشطة الجديدة كمسودات.
          </p>
        </div>

        <Button
          type="button"
          disabled={
            running
          }
          onClick={
            startBuild
          }
        >
          {running
            ? "جارٍ بناء الدرس..."
            : "بناء الدرس تلقائيًا"}
        </Button>
      </div>

      <div className="mt-4 rounded-xl bg-muted/50 px-4 py-3 text-sm font-medium">
        {status}
      </div>

      {errorMessage ? (
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {rows.length >
      0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[620px] text-right text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">
                  الدفعة
                </th>

                <th className="p-2">
                  الصفحات
                </th>

                <th className="p-2">
                  المقترحات
                </th>

                <th className="p-2">
                  المؤهلة
                </th>

                <th className="p-2">
                  المضافة
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map(
                (row) => (
                  <tr
                    key={
                      row.batch
                    }
                    className="border-b last:border-0"
                  >
                    <td className="p-2 font-bold">
                      {row.batch}
                    </td>

                    <td className="p-2">
                      {row.pages}
                    </td>

                    <td className="p-2">
                      {row.proposals}
                    </td>

                    <td className="p-2">
                      {row.eligible}
                    </td>

                    <td className="p-2 font-bold">
                      {row.inserted}
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
