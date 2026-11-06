import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function RoleRequestsAdminPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: ownProfile, error: profileError } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || ownProfile?.role !== "admin") redirect("/my");

  // This query runs only after verifying the existing administrator. The
  // data is never included in a public endpoint or visitor's server render.
  const { data: requests, error } = await createAdminClient()
    .from("profiles")
    .select("id,full_name,email,country,requested_role,requested_role_at")
    .in("requested_role", ["teacher", "school"])
    .eq("role", "student")
    .order("requested_role_at", { ascending: true })
    .limit(100);

  return (
    <main dir="rtl" className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <p className="text-sm font-semibold text-[#5c796d]">إدارة الحسابات والصلاحيات</p>
        <h1 className="mt-2 text-2xl font-extrabold text-[#174f47]">طلبات حساب المعلم والمدرسة</h1>
        <p className="mt-2 text-sm leading-7 text-[#4a685b]">
          الحساب الجديد لا يحصل على صلاحيات المعلم أو المدرسة تلقائيًا.
          راجع طلبه واعتمده فقط بعد التحقق من الجهة التعليمية.
        </p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm">تعذّر تحميل طلبات الحسابات. راجع إعدادات قاعدة البيانات.</p>}
      {!error && (!requests || requests.length === 0) && (
        <p className="rounded-xl border border-[#dce8de] bg-white p-5 text-sm">لا توجد طلبات قيد المراجعة حاليًا.</p>
      )}
      <div className="grid gap-4">
        {requests?.map(item => (
          <article key={item.id} className="space-y-3 rounded-2xl border border-[#dce8de] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-[#174f47]">{item.full_name || "مستخدم جديد"}</h2>
                <p dir="ltr" className="mt-1 text-left text-sm text-[#567166]">{item.email}</p>
              </div>
              <p className="rounded-lg bg-[#edf5f0] px-3 py-2 text-sm font-bold text-[#174f47]">
                {item.requested_role === "teacher" ? "طلب معلم" : "طلب مدرسة"} — {item.country || "دولة غير محددة"}
              </p>
            </div>
            <form action="/api/admin/role-requests" method="POST" className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="userId" value={item.id}/>
              <input type="hidden" name="requestedRole" value={item.requested_role ?? ""}/>
              <button type="submit" name="decision" value="approve"
                className="min-h-12 rounded-xl bg-[#174f47] px-5 font-bold text-white hover:bg-[#0e3a33]">
                اعتماد الدور بعد التحقق
              </button>
              <Link href="/admin" className="inline-flex min-h-12 items-center rounded-xl border border-[#cbdccf] px-5 text-sm font-bold text-[#174f47]">
                العودة للإدارة
              </Link>
            </form>
          </article>
        ))}
      </div>
    </main>
  );
}
