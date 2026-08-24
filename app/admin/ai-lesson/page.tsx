"use client";

import {
  useState,
} from "react";

type BatchStatus =
  | "ready"
  | "running"
  | "success"
  | "quota"
  | "error";

type PlanResponse = {
  success?: boolean;

  lesson?: {
    id?: string;
    title?: string;
    sourcePageStart?: number;
    sourcePageEnd?: number;
  };

  plan?: {
    totalPages?: number;
    batchSize?: number;
    totalBatches?: number;
    batches?: number[][];
  };

  error?: string;
};

type BatchResult = {
  summary?: {
    pagesRequested?: number;
    pagesReturned?: number;
    proposals?: number;
    auto?: number;
    review?: number;
    reject?: number;
  };

  auto?: unknown[];
  review?: unknown[];
  reject?: unknown[];

  error?: string;
};

const LESSON_ID =
  "3ad8950b-2ac2-4060-ae05-312eb1207460";

function statusText(
  status: BatchStatus
): string {
  switch (status) {
    case "running":
      return "جاري التحليل";

    case "success":
      return "نجح";

    case "quota":
      return "Quota";

    case "error":
      return "خطأ";

    default:
      return "جاهز";
  }
}

export default function AiLessonPage() {
  const [plan, setPlan] =
    useState<PlanResponse | null>(
      null
    );

  const [loadingPlan, setLoadingPlan] =
    useState(false);

  const [pageError, setPageError] =
    useState<string | null>(
      null
    );

  const [statuses, setStatuses] =
    useState<Record<number, BatchStatus>>(
      {}
    );

  const [results, setResults] =
    useState<
      Record<
        number,
        BatchResult
      >
    >({});

  async function loadPlan() {
    setLoadingPlan(true);
    setPageError(null);

    try {
      const response =
        await fetch(
          "/api/admin/lessons/analyze-lesson",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                lessonId:
                  LESSON_ID,

                batchIndex:
                  0,

                batchSize:
                  4,

                planOnly:
                  true,
              }),
          }
        );

      const data =
        (await response.json()) as PlanResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ??
          "تعذر تحميل خطة الدرس."
        );
      }

      setPlan(data);

      const initial:
        Record<
          number,
          BatchStatus
        > = {};

      (
        data.plan?.batches ??
        []
      ).forEach(
        (
          _,
          index
        ) => {
          initial[index] =
            "ready";
        }
      );

      setStatuses(
        initial
      );
    }
    catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "تعذر تحميل خطة الدرس."
      );
    }
    finally {
      setLoadingPlan(false);
    }
  }

  async function runBatch(
    batchIndex: number
  ) {
    if (
      Object.values(
        statuses
      ).includes(
        "running"
      )
    ) {
      return;
    }

    setStatuses(
      (current) => ({
        ...current,
        [batchIndex]:
          "running",
      })
    );

    setPageError(null);

    try {
      const response =
        await fetch(
          "/api/admin/lessons/analyze-lesson",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                lessonId:
                  LESSON_ID,

                batchIndex,

                batchSize:
                  4,
              }),
          }
        );

      const data =
        (await response.json()) as BatchResult;

      if (
        response.status === 429
      ) {
        setStatuses(
          (current) => ({
            ...current,
            [batchIndex]:
              "quota",
          })
        );

        setResults(
          (current) => ({
            ...current,
            [batchIndex]:
              data,
          })
        );

        return;
      }

      if (
        !response.ok
      ) {
        setStatuses(
          (current) => ({
            ...current,
            [batchIndex]:
              "error",
          })
        );

        setResults(
          (current) => ({
            ...current,
            [batchIndex]:
              data,
          })
        );

        return;
      }

      setStatuses(
        (current) => ({
          ...current,
          [batchIndex]:
            "success",
        })
      );

      setResults(
        (current) => ({
          ...current,
          [batchIndex]:
            data,
        })
      );
    }
    catch (error) {
      setStatuses(
        (current) => ({
          ...current,
          [batchIndex]:
            "error",
        })
      );

      setResults(
        (current) => ({
          ...current,
          [batchIndex]: {
            error:
              error instanceof Error
                ? error.message
                : "تعذر تشغيل الدفعة.",
          },
        })
      );
    }
  }

  const batches =
    plan?.plan
      ?.batches ??
    [];

  return (
    <main
      dir="rtl"
      className="mx-auto min-h-screen max-w-6xl bg-slate-50 px-4 py-8"
    >
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black text-slate-900">
          محلل الدرس بالذكاء الاصطناعي
        </h1>

        <p className="mt-2 text-slate-600">
          تحليل الدرس على دفعات مع مراجعة النتائج قبل اعتماد أي تعديل.
        </p>

        <button
          type="button"
          disabled={
            loadingPlan
          }
          onClick={
            loadPlan
          }
          className="mt-6 rounded-2xl bg-violet-600 px-6 py-3 font-black text-white disabled:opacity-50"
        >
          {loadingPlan
            ? "جاري تحميل الخطة..."
            : "تحميل خطة الدرس"}
        </button>

        {pageError ? (
          <p className="mt-4 rounded-xl bg-rose-50 p-4 font-bold text-rose-700">
            {pageError}
          </p>
        ) : null}
      </div>

      {plan?.plan ? (
        <section className="mt-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black text-slate-900">
              {plan.lesson?.title ?? "الدرس"}
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">
                  عدد الصفحات
                </div>
                <div className="mt-1 text-2xl font-black">
                  {plan.plan.totalPages}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">
                  عدد الدفعات
                </div>
                <div className="mt-1 text-2xl font-black">
                  {plan.plan.totalBatches}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">
                  حجم الدفعة
                </div>
                <div className="mt-1 text-2xl font-black">
                  {plan.plan.batchSize}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {batches.map(
              (
                pages,
                index
              ) => {
                const status =
                  statuses[
                    index
                  ] ??
                  "ready";

                const result =
                  results[
                    index
                  ];

                return (
                  <article
                    key={
                      index
                    }
                    className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-900">
                          الدفعة {index + 1}
                        </h3>

                        <p className="mt-1 text-slate-600">
                          الصفحات:{" "}
                          {pages.join(
                            " - "
                          )}
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">
                        {statusText(
                          status
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={
                        status ===
                          "running" ||
                        Object.values(
                          statuses
                        ).includes(
                          "running"
                        )
                      }
                      onClick={() =>
                        runBatch(
                          index
                        )
                      }
                      className="mt-5 w-full rounded-2xl bg-sky-600 px-5 py-3 font-black text-white disabled:opacity-50"
                    >
                      {status ===
                      "running"
                        ? "جاري التحليل..."
                        : status ===
                            "success"
                          ? "إعادة تحليل الدفعة"
                          : "تحليل هذه الدفعة"}
                    </button>

                    {result?.summary ? (
                      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-emerald-50 p-3">
                          <div className="text-xs font-bold text-emerald-700">
                            AUTO
                          </div>
                          <div className="mt-1 text-xl font-black">
                            {result.summary.auto ?? 0}
                          </div>
                        </div>

                        <div className="rounded-xl bg-amber-50 p-3">
                          <div className="text-xs font-bold text-amber-700">
                            REVIEW
                          </div>
                          <div className="mt-1 text-xl font-black">
                            {result.summary.review ?? 0}
                          </div>
                        </div>

                        <div className="rounded-xl bg-rose-50 p-3">
                          <div className="text-xs font-bold text-rose-700">
                            REJECT
                          </div>
                          <div className="mt-1 text-xl font-black">
                            {result.summary.reject ?? 0}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {result?.error ? (
                      <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">
                        {result.error}
                      </p>
                    ) : null}
                  </article>
                );
              }
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
