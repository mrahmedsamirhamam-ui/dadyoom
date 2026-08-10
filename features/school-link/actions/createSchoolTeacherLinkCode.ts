"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function createSchoolTeacherLinkCodeAction() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const db =
    supabase as unknown as SupabaseClient;

  const { error } =
    await db.rpc(
      "create_school_teacher_link_code"
    );

  if (error) {
    redirect(
      "/teacher?schoolLinkError=" +
        encodeURIComponent(error.message)
    );
  }

  revalidatePath("/teacher");

  redirect(
    "/teacher?schoolLinkSuccess=" +
      encodeURIComponent(
        "تم إنشاء كود ربط المدرسة."
      )
  );
}
