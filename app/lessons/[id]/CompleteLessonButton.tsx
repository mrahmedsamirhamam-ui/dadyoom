"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CompleteLessonButtonProps = {
  lessonId: string;
  userId: string;
  initialCompleted: boolean;
};

export default function CompleteLessonButton({
  lessonId,
  userId,
  initialCompleted,
}: CompleteLessonButtonProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function toggleLessonCompletion() {
    setLoading(true);

    const nextCompleted = !completed;

    const { error } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          completed: nextCompleted,
          completed_at: nextCompleted
            ? new Date().toISOString()
            : null,
        },
        {
          onConflict: "user_id,lesson_id",
        }
      );

    if (error) {
      console.error(error);
      alert("تعذر حفظ تقدم الدرس.");
      setLoading(false);
      return;
    }

    setCompleted(nextCompleted);
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={toggleLessonCompletion}
      disabled={loading}
      className={`w-full rounded-2xl px-6 py-4 text-lg font-bold text-white transition ${
        completed
          ? "bg-slate-600 hover:bg-slate-700"
          : "bg-emerald-600 hover:bg-emerald-700"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading
        ? "جارٍ الحفظ..."
        : completed
          ? "إلغاء إكمال الدرس"
          : "أنهيت هذا الدرس"}
    </button>
  );
}