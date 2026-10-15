"use server";

import { revalidatePath } from "next/cache";
import { getDashboardRequestViewer } from "@/lib/auth/request-viewer";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateSupportTicket(formData: FormData) {
  const { user, userError, profile, profileError } = await getDashboardRequestViewer();
  if (userError || profileError || !user || profile?.role?.trim().toLowerCase() !== "admin") {
    throw new Error("غير مصرح بتعديل طلبات الدعم.");
  }
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const admin_note = String(formData.get("admin_note") ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(id)
    || !["new", "in_progress", "resolved"].includes(status)
    || admin_note.length > 2000) {
    throw new Error("بيانات التحديث غير صالحة.");
  }
  const db = createAdminClient();
  const result = await db.from("support_tickets")
    .update({ status, admin_note, updated_at: new Date().toISOString() })
    .eq("id", id).select("id").single();
  if (result.error || !result.data) {
    throw new Error("تعذر حفظ حالة الطلب. يرجى إعادة المحاولة.");
  }
  revalidatePath("/admin/support");
}
