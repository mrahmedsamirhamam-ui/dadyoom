"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function optionalText(value: FormDataEntryValue | null, max: number) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : null;
}

export async function saveReadingPassportEntry(formData: FormData) {
  const lessonId = String(formData.get("lesson_id") ?? "").trim();
  const status = String(formData.get("status") ?? "started").trim();

  if (!lessonId) {
    throw new Error("معرّف الدرس مطلوب.");
  }

  if (status !== "started" && status !== "completed") {
    throw new Error("حالة جواز القراءة غير صحيحة.");
  }

  const rawScore = String(formData.get("comprehension_score") ?? "").trim();
  const comprehensionScore =
    rawScore === ""
      ? null
      : Number(rawScore);

  if (
    comprehensionScore !== null &&
    (
      !Number.isInteger(comprehensionScore) ||
      comprehensionScore < 0 ||
      comprehensionScore > 100
    )
  ) {
    throw new Error("درجة الفهم يجب أن تكون من 0 إلى 100.");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("يجب تسجيل الدخول لحفظ جواز القراءة.");
  }

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id,lesson_type,status")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError) {
    throw new Error(lessonError.message);
  }

  if (
    !lesson ||
    lesson.status !== "published" ||
    lesson.lesson_type !== "reading"
  ) {
    throw new Error("هذا الدرس غير متاح في جواز القراءة.");
  }

  const { error } = await supabase
    .from("reading_passport_entries")
    .upsert(
      {
        student_id: user.id,
        lesson_id: lessonId,
        summary: optionalText(formData.get("summary"), 4000),
        critical_reflection: optionalText(
          formData.get("critical_reflection"),
          3000
        ),
        creative_response: optionalText(
          formData.get("creative_response"),
          3000
        ),
        comprehension_score: comprehensionScore,
        status,
        completed_at:
          status === "completed"
            ? new Date().toISOString()
            : null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "student_id,lesson_id",
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/reading-challenge");
  revalidatePath("/journey");
}
