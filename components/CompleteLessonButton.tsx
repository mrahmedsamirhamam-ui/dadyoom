"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CompleteLessonButton({
  lessonId,
}: {
  lessonId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  async function completeLesson() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lessonId }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "تعذر إكمال الدرس.");
      }

      setCompleted(true);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "حدث خطأ غير متوقع."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={completeLesson}
        disabled={loading || completed}
        className="rounded-xl bg-white px-5 py-3 font-black text-teal-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {completed
          ? "تم إكمال الدرس ✓"
          : loading
            ? "جارٍ الحفظ..."
            : "إكمال الدرس"}
      </button>

      {error ? (
        <p className="text-sm font-bold text-red-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}
