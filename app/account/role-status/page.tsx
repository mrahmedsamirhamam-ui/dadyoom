import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "حالة اعتماد نوع الحساب — ضاديوم",
  robots: { index: false, follow: false },
};

const roleLabel: Record<string, string> = { teacher: "معلم", school: "مدرسة" };

export default async function AccountRoleStatusPage() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { data: request, error: requestError } = await supabase
    .from("profile_role_requests")
    .select("requested_role,status,requested_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (requestError) {
    throw new Error("تعذر عرض حالة طلب الحساب. حاول مرة أخرى.");
  }
  if (!request) redirect("/my");

  const role = roleLabel[request.requested_role] || "نوع الحساب المطلوب";
  const state = request.status === "approved" ? "approved"
    : request.status === "rejected" ? "rejected" : "pending";

  return (
    <AuthShell
      title="حالة طلب نوع الحساب"
      description="يمكنك متابعة الطلب دون إعادة تسجيل الدخول أو إنشاء حساب آخر."
    >
      <div dir="rtl" className="space-y-6 text-center">
        <div className="rounded-2xl border border-[#d7e7db] bg-[#f2f8f1] p-5">
          <p className="text-sm font-semibold text-[#5c7468]">نوع الحساب المطلوب</p>
          <p className="mt-2 text-xl font-extrabold text-[#174f47]">{role}</p>
          <p role="status" className="mt-3 text-sm leading-8 text-[#355d50]">
            {state === "pending"
              ? "طلبك قيد المراجعة، ولم تُفعّل صلاحيات المعلم أو المدرسة بعد."
              : state === "approved"
                ? "تم اعتماد الطلب. ادخل إلى مساحتك لمعرفة الصلاحيات المفعّلة."
                : "انتهت مراجعة الطلب دون اعتماده. يمكنك التواصل مع إدارة ضاديوم للاستفسار."}
          </p>
        </div>
        <Link href="/my"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#174f47] px-6 py-3 text-sm font-extrabold text-white focus-visible:outline-4 focus-visible:outline-[#d2ac58]">
          العودة إلى مساحتي الحالية
        </Link>
        <p className="text-xs leading-7 text-[#617267]">
          تستطيع استخدام إمكانات حسابك الحالي فقط إلى أن تتغير صلاحياته رسميًا. لا حاجة للتسجيل مرة ثانية.
        </p>
      </div>
    </AuthShell>
  );
}
