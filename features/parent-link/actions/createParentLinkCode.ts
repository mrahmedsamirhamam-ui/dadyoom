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

  const {
    data,
    error,
  } = await db.rpc(
    "create_parent_link_code"
  );

  if (error) {
    redirect(
      "/student?parentLinkError=" +
        encodeURIComponent(
          error.message
        )
    );
  }

  const result =
    Array.isArray(data)
      ? data[0]
      : data;

  revalidatePath("/student");

  redirect(
    "/student?parentLinkSuccess=" +
      encodeURIComponent(
        `تم إنشاء كود الربط: ${
          result?.code ?? ""
        }`
      )
  );
}
