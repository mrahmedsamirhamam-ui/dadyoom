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

export async function createParentLinkCodeAction() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Enforce the same role boundary as the student dashboard.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role?.trim().toLowerCase();
  if (profileError || role !== "student") {
    redirect("/login");
  }

  const db =
    supabase as unknown as SupabaseClient;

  const { data, error } = await db.rpc(
    "create_parent_link_code"
  );

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    // Do not expose database details or the one-time code in the URL.
    redirect("/student?parentLinkError=failed");
  }

  revalidatePath("/student");
  redirect("/student?parentLinkSuccess=created");
}
