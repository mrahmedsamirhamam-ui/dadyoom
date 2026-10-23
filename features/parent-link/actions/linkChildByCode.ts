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
    redirect("/parent?linkError=code-required");
  }

  if (code.length > 64 || !["", "الأب", "الأم", "ولي أمر"].includes(relationship)) {
    redirect("/parent?linkError=invalid");
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

  // The caller must be an authorized parent even if the RPC is invoked
  // outside of the dashboard UI. Database RLS remains mandatory.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role?.trim().toLowerCase();
  if (profileError || (role !== "parent" && role !== "admin")) {
    redirect("/student");
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
    // Do not leak SQL/RPC errors, student names or other private data in a URL.
    redirect("/parent?linkError=invalid");
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    redirect("/parent?linkError=invalid");
  }
  revalidatePath("/parent");
  redirect(
    result?.already_linked
      ? "/parent?linkSuccess=already-linked"
      : "/parent?linkSuccess=linked"
  );
}
