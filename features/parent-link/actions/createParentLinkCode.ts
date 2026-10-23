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

  const db =
    supabase as unknown as SupabaseClient;

  const { error } = await db.rpc(
    "create_parent_link_code"
  );

  if (error) {
    // Do not expose database details or the one-time code in the URL.
    redirect("/student?parentLinkError=failed");
  }

  revalidatePath("/student");
  redirect("/student?parentLinkSuccess=created");
}
