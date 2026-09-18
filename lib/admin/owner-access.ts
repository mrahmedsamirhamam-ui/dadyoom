import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requireOwnerAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/admin/subscriptions");
  }

  const { data: owner, error: ownerError } = await supabase
    .from("edu_admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownerError || !owner) {
    redirect("/student?error=admin_access_denied");
  }

  return user;
}
