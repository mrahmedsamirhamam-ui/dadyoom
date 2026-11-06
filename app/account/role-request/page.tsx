import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * A requested teacher/school type is not permission. It is a private pending
 * application until explicitly approved by an existing account administrator.
 */
export default async function RoleRequestPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,requested_role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new Error("تعذّر التحقق من طلب الحساب.");
  const requested = profile?.requested_role;
  if (profile?.role !== "student" || !["teacher", "school"].includes(requested ?? "")) {
    redirect("/my");
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f6f8f3] px-4 py-10">
      <section className="w-full max-w-xl space-y-6 rounded-3xl border border-[#cbdccf] bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-bold text-[#456e60]">ضاديوم — بيت العربية الرقمي</p>
        <h1 className="text-2xl font-extrabold text-[#174f47]">طلب حساب {requested === "teacher" ? "معلم" : "مدرسة"} قيد المراجعة</h1>
        <p className="text-base leading-8 text-[#3e5f53]">
          وصل طلبك، ولا تحتاج إلى إنشاء حساب آخر أو تسجيل الدخول من جديد.
          يمكنك تصفح المناهج أثناء مراجعة نوع الحساب. صلاحيات الطلاب والمدارس الأخرى
          لا تُفعّل قبل الموافقة.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/courses" className="flex min-h-12 items-center justify-center rounded-xl bg-[#174f47] px-5 py-3 font-extrabold text-white">تصفح المناهج</Link>
          <Link href="/my" className="flex min-h-12 items-center justify-center rounded-xl border border-[#bfd3c5] px-5 py-3 font-bold text-[#174f47]">تحديث حالة طلبي</Link>
        </div>
        <p className="text-sm leading-7 text-[#617b6f]">
          لا نعرض طلبات الحسابات الأخرى، ولا نُجري مقارنة بين المستخدمين.
        </p>
      </section>
    </main>
  );
}
