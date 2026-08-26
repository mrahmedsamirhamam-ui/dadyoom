"use client";

import { useEffect } from "react";

import { logger } from "@/lib/logger";

type ErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ErrorPage({
  error,
  reset,
}: ErrorPageProps) {
  useEffect(() => {
    logger.error(
      "APP_ERROR_BOUNDARY",
      {
        message: error.message,
        digest: error.digest ?? null,
        stack:
          process.env.NODE_ENV === "development"
            ? error.stack
            : undefined,
      }
    );
  }, [error]);

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-50 px-4"
    >
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="text-5xl">
          ⚠️
        </div>

        <h1 className="mt-5 text-2xl font-black text-slate-900">
          حدث خطأ غير متوقع
        </h1>

        <p className="mt-3 leading-7 text-slate-600">
          لم نتمكن من إكمال العملية الآن.
          يمكنك المحاولة مرة أخرى دون فقدان تقدمك المحفوظ.
        </p>

        {error.digest ? (
          <p className="mt-4 text-xs text-slate-400">
            رقم الخطأ: {error.digest}
          </p>
        ) : null}

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
        >
          حاول مرة أخرى
        </button>
      </section>
    </main>
  );
}
