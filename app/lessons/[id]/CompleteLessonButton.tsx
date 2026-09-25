"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CompleteLessonButtonProps = {
  lessonId: string;
  userId: string;
  initialCompleted: boolean;
};

export default function CompleteLessonButton({
  lessonId,
  initialCompleted,
}: CompleteLessonButtonProps) {
  const router = useRouter();

  const [
    completed,
    setCompleted,
  ] = useState(
    initialCompleted,
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function completeLesson() {
    if (
      loading ||
      completed
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/lessons/complete",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                lessonId,
              }),
          },
        );

      const result =
        (await response.json()) as {
          success?: boolean;
          error?: string;
        };

      if (
        !response.ok ||
        result.success !== true
      ) {
        throw new Error(
          result.error ??
            "تعذر إكمال الدرس.",
        );
      }

      setCompleted(true);
      router.refresh();
    }
    catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "تعذر إكمال الدرس.",
      );
    }
    finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={
          completeLesson
        }
        disabled={
          loading ||
          completed
        }
        className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:opacity-70"
      >
        {loading
          ? "جارٍ التحقق والحفظ..."
          : completed
            ? "تم إكمال الدرس ✓"
            : "إنهاء الدرس"}
      </button>

      {error ? (
        <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">
          {error}
        </p>
      ) : null}
    </div>
  );
}
