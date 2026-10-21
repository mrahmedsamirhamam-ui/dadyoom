"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CompleteLessonButtonProps = {
  lessonId: string;
  // Retained for compatibility with older imports; identity is resolved server-side.
  userId: string;
  initialCompleted: boolean;
};

/**
 * Legacy lesson button: completion is not a toggle.
 * Only the canonical server gate can mark a lesson complete after assessment.
 */
export default function CompleteLessonButton({
  lessonId,
  initialCompleted,
}: CompleteLessonButtonProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function complete() {
    if (completed || loading) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "أكمل التقويم المطلوب أولًا.");
      }

      setCompleted(true);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "تعذر إكمال الدرس. حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={complete}
        disabled={loading || completed}
        className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "جارٍ التحقق من إتقان الدرس..."
          : completed
            ? "تم إكمال الدرس ✓"
            : "تحقّق من إتمام الدرس"}
      </button>
      {error ? (
        <p role="alert" className="text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
