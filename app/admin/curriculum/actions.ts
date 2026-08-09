"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    profile?.role?.trim().toLowerCase() !== "admin"
  ) {
    throw new Error("غير مصرح لك بإدارة المناهج.");
  }

  return supabase;
}

function required(
  formData: FormData,
  key: string
) {
  const value =
    formData.get(key);

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `الحقل ${key} مطلوب.`
    );
  }

  return value.trim();
}

function optional(
  formData: FormData,
  key: string
) {
  const value =
    formData.get(key);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function orderNumber(
  formData: FormData
) {
  const value =
    Number(
      formData.get("order_no")
    );

  return Number.isFinite(value) &&
    value >= 0
    ? Math.floor(value)
    : 1;
}

function refresh() {
  revalidatePath(
    "/admin/curriculum"
  );
}

export async function createCountryAction(
  formData: FormData
) {
  const supabase =
    await requireAdmin();

  const nameAr =
    required(
      formData,
      "name_ar"
    );

  const nameEn =
    optional(
      formData,
      "name_en"
    );

  const { error } =
    await supabase
      .from("edu_countries")
      .insert({
        name_ar: nameAr,
        name_en:
          nameEn || null,
        is_active: true,
      });

  if (error) {
    throw error;
  }

  refresh();
}

export async function createCurriculumAction(
  formData: FormData
) {
  const supabase =
    await requireAdmin();

  const { error } =
    await supabase
      .from("edu_curricula")
      .insert({
        country_id:
          required(
            formData,
            "country_id"
          ),

        name_ar:
          required(
            formData,
            "name_ar"
          ),

        name_en:
          optional(
            formData,
            "name_en"
          ) || null,

        is_active: true,
      });

  if (error) {
    throw error;
  }

  refresh();
}

export async function createGradeAction(
  formData: FormData
) {
  const supabase =
    await requireAdmin();

  const { error } =
    await supabase
      .from("edu_grades")
      .insert({
        curriculum_id:
          required(
            formData,
            "curriculum_id"
          ),

        name_ar:
          required(
            formData,
            "name_ar"
          ),

        name_en:
          optional(
            formData,
            "name_en"
          ) || null,

        order_no:
          orderNumber(formData),
      });

  if (error) {
    throw error;
  }

  refresh();
}

export async function createSubjectAction(
  formData: FormData
) {
  const supabase =
    await requireAdmin();

  const { error } =
    await supabase
      .from("edu_subjects")
      .insert({
        grade_id:
          required(
            formData,
            "grade_id"
          ),

        name_ar:
          required(
            formData,
            "name_ar"
          ),

        name_en:
          optional(
            formData,
            "name_en"
          ) || null,

        icon:
          optional(
            formData,
            "icon"
          ) || null,

        color:
          optional(
            formData,
            "color"
          ) || null,

        order_no:
          orderNumber(formData),

        is_active: true,
      });

  if (error) {
    throw error;
  }

  refresh();
}

export async function createUnitAction(
  formData: FormData
) {
  const supabase =
    await requireAdmin();

  const { error } =
    await supabase
      .from("edu_units")
      .insert({
        subject_id:
          required(
            formData,
            "subject_id"
          ),

        title:
          required(
            formData,
            "title"
          ),

        description:
          optional(
            formData,
            "description"
          ) || null,

        order_no:
          orderNumber(formData),

        is_published:
          formData.get(
            "is_published"
          ) === "on",
      });

  if (error) {
    throw error;
  }

  refresh();
}