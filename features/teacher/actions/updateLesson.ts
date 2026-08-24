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

  /*
   * LESSON_CONTENT_SAVE_FIX_V4
   *
   * Each editor form updates only the fields
   * that it actually submitted.
   */
  const hasTitle =
    formData.has("title");

  const hasSummary =
    formData.has("summary");

  const hasContent =
    formData.has("content");

  const title =
    hasTitle &&
    typeof formData.get("title") === "string"
      ? String(formData.get("title")).trim()
      : "";

  const summary =
    hasSummary &&
    typeof formData.get("summary") === "string"
      ? String(formData.get("summary")).trim()
      : "";

  const content =
    hasContent &&
    typeof formData.get("content") === "string"
      ? String(formData.get("content")).trim()
      : "";

  if (!id) {
    throw new Error(
      "\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062f\u0631\u0633 \u0645\u0637\u0644\u0648\u0628."
    );
  }

  if (
    hasTitle &&
    !title
  ) {
    throw new Error(
      "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062f\u0631\u0633 \u0645\u0637\u0644\u0648\u0628."
    );
  }

  if (
    !hasTitle &&
    !hasSummary &&
    !hasContent
  ) {
    throw new Error(
      "No lesson fields were submitted."
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

  const lessonUpdate: {
    title?: string;
    summary?: string;
    content?: string;
    updated_at: string;
  } = {
    updated_at:
      new Date().toISOString(),
  };

  if (hasTitle) {
    lessonUpdate.title =
      title;
  }

  if (hasSummary) {
    lessonUpdate.summary =
      summary;
  }

  if (hasContent) {
    lessonUpdate.content =
      content;
  }

  const { error } = await supabase
    .from("lessons")
    .update(
      lessonUpdate
    )
    .eq("id", id);

  if (error) {
    throw error;
  }

  revalidatePath(`/teacher/${id}`);
  revalidatePath(`/lessons/${id}`);
  revalidatePath("/teacher");
}