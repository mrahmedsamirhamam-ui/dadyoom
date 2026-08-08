"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

function getRequiredString(
  formData: FormData,
  field: string
): string {
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

async function assertCanManageLesson(
  lessonId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(
      "يجب تسجيل الدخول لإدارة المفردات."
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
      "غير مصرح لك بإدارة مفردات الدروس."
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
      "لا يمكنك إدارة مفردات درس يخص معلّمًا آخر."
    );
  }

  return {
    supabase,
    user,
    role,
  };
}

export async function addVocabulary(
  formData: FormData
) {
  const lessonId = getRequiredString(
    formData,
    "lesson_id"
  );

  const word = getRequiredString(
    formData,
    "word"
  );

  const meaning = getRequiredString(
    formData,
    "meaning"
  );

  const exampleValue =
    formData.get("example");

  const example =
    typeof exampleValue === "string" &&
    exampleValue.trim()
      ? exampleValue.trim()
      : null;

  const {
    supabase,
  } = await assertCanManageLesson(
    lessonId
  );

  const {
    data: lastItem,
    error: lastItemError,
  } = await supabase
    .from("lesson_vocabulary")
    .select("display_order")
    .eq("lesson_id", lessonId)
    .order("display_order", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (lastItemError) {
    throw lastItemError;
  }

  const displayOrder =
    (lastItem?.display_order ?? 0) + 1;

  const { error } = await supabase
    .from("lesson_vocabulary")
    .insert({
      lesson_id: lessonId,
      word,
      meaning,
      example,
      display_order: displayOrder,
    });

  if (error) {
    throw error;
  }

  revalidatePath(
    `/teacher/${lessonId}`
  );

  revalidatePath(
    `/lessons/${lessonId}`
  );
}

export async function updateVocabulary(
  formData: FormData
) {
  const id = getRequiredString(
    formData,
    "id"
  );

  const lessonId = getRequiredString(
    formData,
    "lesson_id"
  );

  const word = getRequiredString(
    formData,
    "word"
  );

  const meaning = getRequiredString(
    formData,
    "meaning"
  );

  const exampleValue =
    formData.get("example");

  const example =
    typeof exampleValue === "string" &&
    exampleValue.trim()
      ? exampleValue.trim()
      : null;

  const {
    supabase,
  } = await assertCanManageLesson(
    lessonId
  );

  const { error } = await supabase
    .from("lesson_vocabulary")
    .update({
      word,
      meaning,
      example,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .eq("lesson_id", lessonId);

  if (error) {
    throw error;
  }

  revalidatePath(
    `/teacher/${lessonId}`
  );

  revalidatePath(
    `/lessons/${lessonId}`
  );
}

export async function deleteVocabulary(
  formData: FormData
) {
  const id = getRequiredString(
    formData,
    "id"
  );

  const lessonId = getRequiredString(
    formData,
    "lesson_id"
  );

  const {
    supabase,
  } = await assertCanManageLesson(
    lessonId
  );

  const { error } = await supabase
    .from("lesson_vocabulary")
    .delete()
    .eq("id", id)
    .eq("lesson_id", lessonId);

  if (error) {
    throw error;
  }

  revalidatePath(
    `/teacher/${lessonId}`
  );

  revalidatePath(
    `/lessons/${lessonId}`
  );
}