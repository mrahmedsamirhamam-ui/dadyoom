"use server";

import {
  revalidatePath,
} from "next/cache";

import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  createClient,
} from "@/lib/supabase/server";

function requiredString(
  formData: FormData,
  field: string
) {
  const value =
    formData.get(field);

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

function optionalString(
  formData: FormData,
  field: string
) {
  const value =
    formData.get(field);

  return typeof value === "string"
    ? value.trim()
    : "";
}

export async function createTeacherClassAction(
  formData: FormData
) {
  const supabase =
    await createClient();

  const {
    data: { user },
    error: authError,
  } =
    await supabase.auth.getUser();

  if (
    authError ||
    !user
  ) {
    throw new Error(
      "يجب تسجيل الدخول لإنشاء فصل."
    );
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "role"
    )
    .eq(
      "id",
      user.id
    )
    .maybeSingle();

  if (
    profileError ||
    !profile
  ) {
    throw new Error(
      "تعذر التحقق من صلاحيات الحساب."
    );
  }

  const role =
    profile.role
      ?.trim()
      .toLowerCase() ??
    "";

  if (
    role !== "teacher" &&
    role !== "admin"
  ) {
    throw new Error(
      "هذه الميزة متاحة للمعلمين فقط."
    );
  }

  const name =
    requiredString(
      formData,
      "name"
    );

  const description =
    optionalString(
      formData,
      "description"
    );

  const academicYear =
    optionalString(
      formData,
      "academic_year"
    );

  /*
   * teacher_classes أضيف حديثًا،
   * لذلك نستخدم SupabaseClient العام
   * إلى أن نعيد توليد أنواع Supabase
   * في مرحلة التنظيف النهائية.
   */
  const classroomDb =
    supabase as unknown as
      SupabaseClient;

  const {
    error,
  } = await classroomDb
    .from(
      "teacher_classes"
    )
    .insert({
      teacher_id:
        user.id,

      name,

      description:
        description || null,

      academic_year:
        academicYear || null,

      is_active:
        true,
    });

  if (error) {
    throw error;
  }

  revalidatePath(
    "/teacher"
  );
}
