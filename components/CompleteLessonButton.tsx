"use client";

import { useState } from "react";

export default function CompleteLessonButton({
  lessonId,
}: {
  lessonId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  async function completeLesson() {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/progress/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error ?? "حدث خطأ أثناء حفظ تقدمك");
        return;
      }

      setCompleted(true);

      // افتح ضاد أولًا قبل ظهور رسالة alert
      window.dispatchEvent(
        new CustomEvent("dadyoom:lesson-completed", {
          detail: {
            lessonId,
            alreadyCompleted: Boolean(result.alreadyCompleted),
          },
        })
      );

      if (result.alreadyCompleted) {
        alert("✅ هذا الدرس مكتمل بالفعل");
      } else {
        alert("🎉 تم حفظ تقدمك بنجاح");
      }
    } catch (error) {
      console.error("Complete lesson error:", error);
      alert("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={completeLesson}
      disabled={loading || completed}
      className="mt-8 rounded-xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading
        ? "جارٍ الحفظ..."
        : completed
          ? "✅ تم إكمال الدرس"
          : "✅ أكملت الدرس"}
    </button>
  );
}