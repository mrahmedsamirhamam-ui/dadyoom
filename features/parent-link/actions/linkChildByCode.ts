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

export async function linkChildByCodeAction(
  formData: FormData
) {
  const codeValue =
    formData.get("code");

  const relationshipValue =
    formData.get("relationship");

  const code =
    typeof codeValue === "string"
      ? codeValue.trim().toUpperCase()
      : "";

  const relationship =
    typeof relationshipValue === "string"
      ? relationshipValue.trim()
      : "";

  if (!code) {
    redirect(
      "/parent?linkError=" +
        encodeURIComponent(
          "أدخل كود الربط."
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
    data,
    error,
  } = await db.rpc(
    "link_child_by_code",
    {
      p_code:
        code,

      p_relationship:
        relationship || null,
    }
  );

  if (error) {
    redirect(
      "/parent?linkError=" +
        encodeURIComponent(
          error.message
        )
    );
  }

  const result =
    Array.isArray(data)
      ? data[0]
      : data;

  revalidatePath("/parent");

  const message =
    result?.already_linked
      ? "هذا الطالب مرتبط بحسابك بالفعل."
      : `تم ربط ${
          result?.student_name ??
          "الطالب"
        } بحسابك بنجاح.`;

  redirect(
    "/parent?linkSuccess=" +
      encodeURIComponent(
        message
      )
  );
}
