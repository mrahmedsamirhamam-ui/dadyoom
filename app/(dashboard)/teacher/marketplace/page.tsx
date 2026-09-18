import type { SupabaseClient } from "@supabase/supabase-js";

import TeacherMarketplaceClient from "./TeacherMarketplaceClient";

import { createClient } from "@/lib/supabase/server";

export default async function TeacherMarketplacePage() {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: courses } = await db
    .from("edu_marketplace_courses")
    .select(
      "id,slug,title,description,price,currency,delivery_mode,status,commission_bps,created_at",
    )
    .eq("teacher_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  const { data: earnings } = await db
    .from("edu_teacher_earnings")
    .select(
      "id,gross_amount,platform_fee,net_amount,currency,status,created_at",
    )
    .eq("teacher_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  const { data: payout } = await db
    .from("edu_teacher_payout_profiles")
    .select(
      "paypal_email,iban,account_holder_name,bank_name,swift_bic,country,is_verified",
    )
    .eq("teacher_id", user.id)
    .maybeSingle();

  return (
    <TeacherMarketplaceClient
      courses={courses ?? []}
      earnings={earnings ?? []}
      payout={payout ?? null}
    />
  );
}
