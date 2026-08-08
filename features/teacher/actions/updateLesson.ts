"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function updateLesson(
  formData: FormData
) {
  const id =
    typeof formData.get("id") === "string"
      ? String(formData.get("id")).trim()
      : "";

  const title =
    typeof formData.get("title") === "string"
      ? String(formData.get("title")).trim()
      : "";

  const summary =
    typeof formData.get("summary") === "string"
      ? String(formData.get("summary")).trim()
      : "";

  const content =
    typeof formData.get("content") === "string"
      ? String(formData.get("content")).trim()
      : "";

  if (!id) {
    throw new Error(
      "معرّف الدرس مطلوب."
    );
  }

  if (!title) {
    throw new Error(
      "عنوان الدرس مطلوب."
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(
      "يجب تسجيل الدخول لتعديل الدرس."
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
      "غير مصرح لك بتعديل الدروس."
    );
  }

  const {
    data: lesson,
    error: lessonError,
  } = await supabase
    .from("lessons")
    .select("id, created_by")
    .eq("id", id)
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
      "لا يمكنك تعديل درس يخص معلّمًا آخر."
    );
  }

  const { error } = await supabase
    .from("lessons")
    .update({
      title,
      summary,
      content,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  revalidatePath(`/teacher/${id}`);
  revalidatePath(`/lessons/${id}`);
  revalidatePath("/teacher");
}