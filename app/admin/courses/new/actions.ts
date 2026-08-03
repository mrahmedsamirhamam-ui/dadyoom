"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createCourse(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("courses").insert({
    title: formData.get("title"),
    description: formData.get("description"),
    image_url: formData.get("image_url"),
    category_id: formData.get("category_id"),
    level: formData.get("level"),
    published: formData.get("published") === "on",
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/courses");
}