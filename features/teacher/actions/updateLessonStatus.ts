"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const allowedStatuses = [
  "draft",
  "review",
  "published",
  "archived",
] as const;

type LessonStatus =
  (typeof allowedStatuses)[number];

function requiredString(
  formData: FormData,
  field: string
) {
  const value = formData.get(field);

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `الحقل ${field} مطلوب.`
    );
  }

  return value.trim();
}

export async function updateLessonStatus(
  formData: FormData
) {
  const lessonId = requiredString(
    formData,
    "lesson_id"
  );

  const statusValue = requiredString(
    formData,
    "status"
  );

  if (
    !allowedStatuses.includes(
      statusValue as LessonStatus
    )
  ) {
    throw new Error(
      "حالة الدرس غير صحيحة."
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(
      "يجب تسجيل الدخول لتغيير حالة الدرس."
    );
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(
      "تعذر التحقق من صلاحيات الحساب."
    );
  }

  const role =
    profile.role?.trim().toLowerCase() ?? "";

  if (
    role !== "admin" &&
    role !== "teacher"
  ) {
    throw new Error(
      "غير مصرح لك بتغيير حالة الدرس."
    );
  }

  const {
    data: lesson,
    error: lessonError,
  } = await supabase
    .from("lessons")
    .select("id, created_by")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError || !lesson) {
    throw new Error(
      "تعذر العثور على الدرس."
    );
  }

  if (
    role === "teacher" &&
    lesson.created_by !== user.id
  ) {
    throw new Error(
      "لا يمكنك تغيير حالة درس يخص معلّمًا آخر."
    );
  }

  const { error } = await supabase
    .from("lessons")
    .update({
      status: statusValue,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", lessonId);

  if (error) {
    throw error;
  }

  revalidatePath(
    `/teacher/${lessonId}`
  );

  revalidatePath(
    `/lessons/${lessonId}`
  );

  revalidatePath("/teacher");
}