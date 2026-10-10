import type { SupabaseClient } from "@supabase/supabase-js";

import TeacherMarketplaceClient from "./TeacherMarketplaceClient";

import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardRequestViewer } from "@/lib/auth/request-viewer";

export default async function TeacherMarketplacePage() {
  // The parent dashboard and role layout already use this request-scoped
  // verified identity. Do not make a second network auth request on Cloudflare.
  const { supabase, user, userError, profile } = await getDashboardRequestViewer();
  if (userError || !user) return null;
  // A direct entrypoint must never expose teacher earnings to a non-teacher.
  const role = profile?.role?.trim().toLowerCase();
  if (role !== "teacher" && role !== "admin") return null;
  const db = supabase as unknown as SupabaseClient;

  const [
    coursesResult,
    earningsResult,
    payoutResult,
  ] = await Promise.all([
    db
      .from("edu_marketplace_courses")
      .select(
        "id,slug,title,description,price,currency,delivery_mode,status,commission_bps,starts_at,ends_at,schedule_note,max_students,created_at",
      )
      .eq("teacher_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(50),

    db
      .from("edu_teacher_earnings")
      .select(
        "id,gross_amount,platform_fee,net_amount,currency,status,created_at",
      )
      .eq("teacher_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(100),

    db
      .from("edu_teacher_payout_profiles")
      .select(
        "bpay_mobile,bpay_name,paypal_email,iban,account_holder_name,bank_name,swift_bic,country,is_verified",
      )
      .eq("teacher_id", user.id)
      .maybeSingle(),
  ]);

  const courses =
    coursesResult.data ?? [];
  const earnings =
    earningsResult.data ?? [];
  const payout =
    payoutResult.data ?? null;

  let pendingBpayPayments: Array<{
    id: string;
    course_id: string;
    amount: number;
    currency: string;
    bank_reference: string | null;
    updated_at: string;
  }> = [];

  if (courses.length) {
    const admin = createAdminClient();
    const courseIds = courses.map((course) => course.id);

    const { data } = await admin
      .from("edu_payment_orders")
      .select("id,course_id,amount,currency,bank_reference,updated_at")
      .eq("provider", "bpay")
      .eq("kind", "course")
      .eq("status", "approved")
      .in("course_id", courseIds)
      .order("updated_at", { ascending: false })
      .limit(100);

    pendingBpayPayments = (data ?? []).map((item) => ({
      id: String(item.id),
      course_id: String(item.course_id),
      amount: Number(item.amount),
      currency: String(item.currency),
      bank_reference: item.bank_reference ? String(item.bank_reference) : null,
      updated_at: String(item.updated_at),
    }));
  }

  return (
    <TeacherMarketplaceClient
      courses={courses}
      earnings={earnings}
      payout={payout}
      pendingBpayPayments={pendingBpayPayments}
    />
  );
}
