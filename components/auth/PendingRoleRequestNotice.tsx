import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * Informational only. Request status does not grant school/teacher privileges;
 * authorization continues to rely on the persisted verified profile role.
 */
export default async function PendingRoleRequestNotice() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;
  const { data: request, error } = await supabase
    .from("profile_role_requests")
    .select("requested_role,status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !request || request.status === "approved") return null;

  const label = request.requested_role === "teacher" ? "معلم" : "مدرسة";
  return (
    <aside dir="rtl" aria-label="حالة طلب نوع الحساب"
      className="mb-5 rounded-2xl border border-[#e4d29c] bg-[#fff9e8] p-4 text-[#664e23]">
      <p className="font-bold">
        {request.status === "pending"
          ? "طلب حساب " + label + " قيد المراجعة"
          : "لم يُعتمد طلب حساب " + label}
      </p>
      <p className="mt-1 text-sm leading-7">
        تظل مساحتك الحالية متاحة. ولن تظهر صلاحيات المعلم أو المدرسة قبل الاعتماد.
      </p>
      <Link href="/account/role-status"
        className="mt-2 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4">
        عرض حالة الطلب
      </Link>
    </aside>
  );
}
