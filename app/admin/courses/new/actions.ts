"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function createCourse(
  formData: FormData
) {
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
    .maybeSingle();

  const role =
    profile?.role?.trim().toLowerCase() ?? "";

  if (
    profileError ||
    role !== "admin"
  ) {
    throw new Error(
      "غير مصرح لك بإنشاء الدورات."
    );
  }

  const title =
    typeof formData.get("title") === "string"
      ? String(formData.get("title")).trim()
      : "";

  if (!title) {
    throw new Error(
      "عنوان الدورة مطلوب."
    );
  }

  const { error } = await supabase
    .from("courses")
    .insert({
      title,
      description:
        formData.get("description"),
      image_url:
        formData.get("image_url"),
      category_id:
        formData.get("category_id"),
      level:
        formData.get("level"),
      published:
        formData.get("published") === "on",
    });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/courses");
}
