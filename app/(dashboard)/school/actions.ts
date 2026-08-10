"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  createClient,
} from "@/lib/supabase/server";

export async function createSchoolAction(
  formData: FormData
) {
  const nameValue =
    formData.get("name");

  const countryValue =
    formData.get("country");

  const academicYearValue =
    formData.get("academicYear");

  const name =
    typeof nameValue === "string"
      ? nameValue.trim()
      : "";

  const country =
    typeof countryValue === "string"
      ? countryValue.trim()
      : "";

  const academicYear =
    typeof academicYearValue === "string"
      ? academicYearValue.trim()
      : "";

  if (!name) {
    redirect(
      "/school?error=" +
        encodeURIComponent(
          "اسم المدرسة مطلوب."
        )
    );
  }

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const db =
    supabase as unknown as SupabaseClient;

  const {
    error,
  } =
    await db.rpc(
      "ensure_my_school",
      {
        p_name: name,
        p_country:
          country || null,
        p_academic_year:
          academicYear || null,
      }
    );

  if (error) {
    redirect(
      "/school?error=" +
        encodeURIComponent(
          error.message
        )
    );
  }

  revalidatePath("/school");

  redirect(
    "/school?success=" +
      encodeURIComponent(
        "تم إنشاء ملف المدرسة بنجاح."
      )
  );
}